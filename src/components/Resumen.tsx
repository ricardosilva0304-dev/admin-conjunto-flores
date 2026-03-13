"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
    TrendingUp, TrendingDown, Wallet, AlertTriangle,
    LayoutGrid, Calendar, ChevronRight, Loader2,
    CheckCircle2, Trophy, Medal
} from "lucide-react";

interface ResumenProps {
    adminName: string;
    goToDeudores: () => void;
}

export default function Resumen({ adminName, goToDeudores }: ResumenProps) {
    const [stats, setStats] = useState({
        ingresosMes: 0, egresosMes: 0, balanceMes: 0,
        carteraPendiente: 0, banco: 0, efectivo: 0
    });
    const [morosos, setMorosos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { cargarDatosDashboard(); }, []);

    async function cargarDatosDashboard() {
        setLoading(true);
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();

        try {
            const [pagosRes, egresosRes, deudasRes] = await Promise.all([
                supabase.from("pagos").select("monto_total, metodo_pago").gte("fecha_pago", primerDiaMes),
                supabase.from("egresos").select("monto").gte("fecha", primerDiaMes),
                supabase.from("deudas_residentes")
                    .select(`*, residentes(id, nombre, torre, apartamento), causaciones_globales(mes_causado, tipo_cobro)`)
                    .gt("saldo_pendiente", 0)
            ]);

            const ingTotal = pagosRes.data?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
            const egrTotal = egresosRes.data?.reduce((acc, e) => acc + Number(e.monto), 0) || 0;
            const porBanco = pagosRes.data?.filter(p => p.metodo_pago === 'Transferencia').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
            const porEfectivo = pagosRes.data?.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;

            let sumaCarteraReal = 0;
            const deudaPorResidente: Record<string, any> = {};

            (deudasRes.data || []).forEach(d => {
                const valorHoy = calcularValorDeudaHoy(d);
                sumaCarteraReal += valorHoy;
                const rId = d.residentes?.id;
                if (rId) {
                    if (!deudaPorResidente[rId]) {
                        deudaPorResidente[rId] = {
                            nombre: d.residentes.nombre,
                            unidad: `T${d.residentes.torre.slice(-1)}-${d.residentes.apartamento}`,
                            totalDeuda: 0, cantidadRecibos: 0
                        };
                    }
                    deudaPorResidente[rId].totalDeuda += valorHoy;
                    deudaPorResidente[rId].cantidadRecibos += 1;
                }
            });

            const topMorosos = Object.values(deudaPorResidente)
                .sort((a: any, b: any) => b.totalDeuda - a.totalDeuda)
                .slice(0, 5);

            setStats({ ingresosMes: ingTotal, egresosMes: egrTotal, balanceMes: ingTotal - egrTotal, carteraPendiente: sumaCarteraReal, banco: porBanco, efectivo: porEfectivo });
            setMorosos(topMorosos);
        } catch (e) {
            console.error("Error dashboard:", e);
        } finally {
            setLoading(false);
        }
    }

    const getSaludo = () => {
        const h = new Date().getHours();
        if (h < 12) return "Buenos días";
        if (h < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    const renderRankIcon = (index: number) => {
        if (index === 0) return <Trophy size={14} className="text-amber-500 fill-amber-500" />;
        if (index === 1) return <Medal size={14} className="text-slate-400 fill-slate-400" />;
        if (index === 2) return <Medal size={14} className="text-orange-400 fill-orange-400" />;
        return <span className="text-[10px] font-black text-slate-300">#{index + 1}</span>;
    };

    if (loading) return (
        <div className="flex flex-col h-64 items-center justify-center gap-4">
            <Loader2 className="animate-spin text-slate-300" size={28} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sincronizando...</p>
        </div>
    );

    const eficiencia = stats.ingresosMes + stats.carteraPendiente > 0
        ? Math.round((stats.ingresosMes / (stats.ingresosMes + stats.carteraPendiente)) * 100)
        : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-24 font-sans animate-in fade-in duration-1000">

            {/* SALUDO + FECHA */}
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-slate-900 font-black tracking-tighter italic leading-none text-2xl sm:text-4xl md:text-5xl">
                        {getSaludo()},&nbsp;
                        <span className="text-emerald-600">{adminName.split(' ')[0]}</span>
                    </h1>
                    <div className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 mt-1.5">
                        <div className="w-5 h-[1.5px] bg-emerald-500 flex-shrink-0"></div>
                        <span className="truncate hidden sm:inline">Panel de control administrativo</span>
                        <span className="truncate sm:hidden">Dashboard</span>
                    </div>
                </div>

                <div className="bg-slate-900 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-xl flex items-center gap-2 shadow-xl flex-shrink-0">
                    <Calendar size={13} className="text-emerald-400 flex-shrink-0" />
                    <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                        <span className="sm:hidden">
                            {new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' }).format(new Date())}
                        </span>
                        <span className="hidden sm:inline">
                            {new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date())}
                        </span>
                    </p>
                </div>
            </div>

            {/* KPI GRID — 2 cols móvil, 4 cols desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Ingresos Mes', labelShort: 'Ingresos', val: stats.ingresosMes, icon: <TrendingUp size={16} />, c: 'emerald' },
                    { label: 'Gastos Mes', labelShort: 'Gastos', val: stats.egresosMes, icon: <TrendingDown size={16} />, c: 'rose' },
                    { label: 'Balance Caja', labelShort: 'Balance', val: stats.balanceMes, icon: <Wallet size={16} />, c: 'blue' },
                    { label: 'Cartera Total', labelShort: 'Cartera', val: stats.carteraPendiente, icon: <AlertTriangle size={16} />, c: 'rose' },
                ].map((item, i) => {
                    const colorClasses: any = {
                        emerald: "bg-emerald-50 text-emerald-600",
                        rose: "bg-rose-50 text-rose-600",
                        blue: "bg-blue-50 text-blue-600"
                    };
                    const isCartera = item.label === 'Cartera Total';
                    return (
                        <div key={i} className="bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2.5 sm:mb-4 ${colorClasses[item.c]}`}>
                                {item.icon}
                            </div>
                            <p className="text-slate-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1 leading-tight">
                                <span className="sm:hidden">{item.labelShort}</span>
                                <span className="hidden sm:inline">{item.label}</span>
                            </p>
                            <h3 className={`font-black tabular-nums leading-tight
                                text-sm sm:text-xl md:text-2xl
                                ${isCartera ? 'text-rose-600' : 'text-slate-800'}`}>
                                ${item.val.toLocaleString('es-CO')}
                            </h3>
                        </div>
                    );
                })}
            </div>

            {/* FILA INFERIOR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

                {/* Arqueo de Caja */}
                <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 flex flex-col gap-4 shadow-sm">
                    <h3 className="text-slate-800 font-bold text-[10px] sm:text-sm uppercase tracking-widest flex items-center gap-2">
                        <LayoutGrid size={13} className="text-slate-400" /> Arqueo de Caja
                    </h3>

                    {/* Horizontal en móvil, vertical en desktop */}
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center sm:border-b border-slate-100 sm:pb-4 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                            <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1 sm:mb-0">Transferencias</span>
                            <span className="font-black text-slate-900 tabular-nums text-sm">${stats.banco.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                            <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1 sm:mb-0">Efectivo</span>
                            <span className="font-black text-slate-900 tabular-nums text-sm">${stats.efectivo.toLocaleString('es-CO')}</span>
                        </div>
                    </div>

                    <div className="bg-emerald-50 p-4 sm:p-6 rounded-2xl text-center border border-emerald-100">
                        <p className="text-[8px] sm:text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Eficiencia Recaudo</p>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-800 tabular-nums">{eficiencia}%</div>
                    </div>
                </div>

                {/* Ranking Deudores */}
                <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-4 sm:mb-8">
                        <h3 className="text-slate-800 font-bold text-[10px] sm:text-sm uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-rose-600 rounded-full flex-shrink-0"></div>
                            Unidades Críticas en Mora
                        </h3>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                        {morosos.length === 0 ? (
                            <div className="py-14 text-center opacity-30">
                                <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={32} />
                                <p className="text-xs font-black uppercase tracking-widest">No hay deudas</p>
                            </div>
                        ) : (
                            morosos.map((m, i) => (
                                <div key={i} className="group flex items-center justify-between p-2.5 sm:p-4 bg-slate-50/50 border border-slate-100 rounded-xl sm:rounded-2xl hover:bg-white hover:border-rose-200 transition-all gap-2">

                                    {/* Rank + badge unidad + nombre */}
                                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                        <div className="w-5 sm:w-6 flex justify-center flex-shrink-0">
                                            {renderRankIcon(i)}
                                        </div>
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 text-white rounded-lg sm:rounded-xl flex items-center justify-center font-black text-[7px] sm:text-[9px] flex-shrink-0 text-center leading-tight px-0.5">
                                            {m.unidad}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] sm:text-xs font-black text-slate-800 uppercase truncate">
                                                {m.nombre}
                                            </p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                                                {m.cantidadRecibos} meses pend.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Monto */}
                                    <p className="text-[10px] sm:text-sm font-black text-rose-600 tabular-nums flex-shrink-0">
                                        ${Number(m.totalDeuda).toLocaleString('es-CO')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={goToDeudores}
                        className="w-full mt-4 sm:mt-8 py-3 sm:py-4 bg-slate-50 text-slate-500 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        Gestionar Cartera Completa <ChevronRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}