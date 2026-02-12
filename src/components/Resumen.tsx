"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    TrendingUp, TrendingDown, Wallet, AlertTriangle,
    LayoutGrid, Calendar, ChevronRight, Loader2,
    CheckCircle2, User, Trophy, Medal
} from "lucide-react";

interface ResumenProps {
    adminName: string;
    goToDeudores: () => void;
}

export default function Resumen({ adminName, goToDeudores }: ResumenProps) {
    const [stats, setStats] = useState({
        ingresosMes: 0,
        egresosMes: 0,
        balanceMes: 0,
        carteraPendiente: 0,
        banco: 0,
        efectivo: 0
    });
    const [morosos, setMorosos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { cargarDatosDashboard(); }, []);

    // --- LÓGICA DE PRECIO DINÁMICO (M1, M2, M3) ---
    const calcularPrecioActual = (deuda: any) => {
        // Si es cargo manual, devolver saldo directo
        if (!deuda.causaciones_globales) return deuda.saldo_pendiente || 0;

        const hoy = new Date();
        const diaMes = hoy.getDate(); // <--- Aquí la llamamos diaMes
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();

        const mesCausadoStr = deuda.causaciones_globales?.mes_causado;
        if (!mesCausadoStr) return deuda.saldo_pendiente || 0;

        const partes = mesCausadoStr.split("-");
        if (partes.length < 2) return deuda.saldo_pendiente || 0;

        const yearC = parseInt(partes[0]);
        const monthC = parseInt(partes[1]);

        // Mapeo de columnas
        const m1 = deuda.precio_m1 || deuda.monto_original || 0;
        const m2 = deuda.precio_m2 || m1;
        const m3 = deuda.precio_m3 || m1;

        let precioTramo = m1;

        // Si ya pasó el mes de la deuda
        if (anioActual > yearC || (anioActual === yearC && mesActual > monthC)) {
            precioTramo = m3;
        } else {
            // Si estamos en el mismo mes
            // CORRECCIÓN: Usar 'diaMes' en lugar de 'dia'
            if (diaMes > 10 && diaMes <= 20) precioTramo = m2;
            if (diaMes > 20) precioTramo = m3;
        }

        // Restar lo que ya pagó anteriormente
        const yaPagado = m1 - (deuda.saldo_pendiente || 0);
        return Math.max(0, precioTramo - yaPagado);
    };

    async function cargarDatosDashboard() {
        setLoading(true);
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();

        try {
            const [pagosRes, egresosRes, deudasRes] = await Promise.all([
                supabase.from("pagos").select("monto_total, metodo_pago").gte("fecha_pago", primerDiaMes),
                supabase.from("egresos").select("monto").gte("fecha", primerDiaMes),
                supabase.from("deudas_residentes").select(`*, residentes(id, nombre, torre, apartamento), causaciones_globales(mes_causado)`).gt("saldo_pendiente", 0)
            ]);

            // Procesar ingresos y egresos
            const ingTotal = pagosRes.data?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
            const egrTotal = egresosRes.data?.reduce((acc, e) => acc + Number(e.monto), 0) || 0;
            const porBanco = pagosRes.data?.filter(p => p.metodo_pago === 'Transferencia').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
            const porEfectivo = pagosRes.data?.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;

            // --- PROCESAR CARTERA AGRUPADA POR RESIDENTE ---
            let sumaCarteraReal = 0;
            const deudaPorResidente: Record<string, any> = {};

            (deudasRes.data || []).forEach(d => {
                const valorHoy = calcularPrecioActual(d);
                sumaCarteraReal += valorHoy;

                // Agrupamos por ID de residente para sumar todas sus deudas
                const rId = d.residentes?.id;
                if (rId) {
                    if (!deudaPorResidente[rId]) {
                        deudaPorResidente[rId] = {
                            nombre: d.residentes.nombre,
                            unidad: `T${d.residentes.torre.replace("Torre ", "")}-${d.residentes.apartamento}`,
                            totalDeuda: 0,
                            cantidadRecibos: 0
                        };
                    }
                    deudaPorResidente[rId].totalDeuda += valorHoy;
                    deudaPorResidente[rId].cantidadRecibos += 1;
                }
            });

            // Convertir objeto a array, ordenar y tomar top 5
            const topMorosos = Object.values(deudaPorResidente)
                .sort((a: any, b: any) => b.totalDeuda - a.totalDeuda)
                .slice(0, 5);

            setStats({
                ingresosMes: ingTotal,
                egresosMes: egrTotal,
                balanceMes: ingTotal - egrTotal,
                carteraPendiente: sumaCarteraReal,
                banco: porBanco,
                efectivo: porEfectivo
            });
            setMorosos(topMorosos);

        } catch (e) {
            console.error(e);
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

    // Función auxiliar para iconos de ranking
    const renderRankIcon = (index: number) => {
        if (index === 0) return <Trophy size={16} className="text-amber-500 fill-amber-500" />;
        if (index === 1) return <Medal size={16} className="text-slate-400 fill-slate-400" />;
        if (index === 2) return <Medal size={16} className="text-orange-400 fill-orange-400" />;
        return <span className="text-xs font-black text-slate-300">#{index + 1}</span>;
    };

    if (loading) return (
        <div className="flex flex-col h-screen items-center justify-center gap-4">
            <Loader2 className="animate-spin text-slate-300" size={30} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Calculando métricas en tiempo real...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-24 font-sans px-2 md:px-0 animate-in fade-in duration-1000">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 md:p-0 rounded-2xl md:bg-transparent shadow-sm md:shadow-none">
                <div>
                    <h1 className="text-slate-900 text-3xl md:text-5xl font-black tracking-tighter leading-none mb-2 italic">
                        {getSaludo()}, {adminName.split(' ')[0]}
                    </h1>
                    <div className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-6 h-[1.5px] bg-emerald-500"></div>
                        Estado financiero dinámico del conjunto
                    </div>
                </div>
                <div className="bg-slate-900 text-white px-5 py-3 rounded-xl flex items-center gap-4 self-start md:self-auto shadow-xl">
                    <Calendar size={18} className="text-emerald-400" />
                    <p className="text-[11px] font-black uppercase tracking-widest">
                        {new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date())}
                    </p>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Ingresos', val: stats.ingresosMes, icon: <TrendingUp size={20} />, c: 'emerald' },
                    { label: 'Gastos', val: stats.egresosMes, icon: <TrendingDown size={20} />, c: 'rose' },
                    { label: 'Balance', val: stats.balanceMes, icon: <Wallet size={20} />, c: 'blue' },
                    { label: 'Cartera Pend.', val: stats.carteraPendiente, icon: <AlertTriangle size={20} />, c: 'rose' },
                ].map((item, i) => {
                    const colorClasses: any = {
                        emerald: "bg-emerald-50 text-emerald-600",
                        rose: "bg-rose-50 text-rose-600",
                        blue: "bg-blue-50 text-blue-600"
                    };
                    return (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorClasses[item.c]}`}>
                                {item.icon}
                            </div>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{item.label}</p>
                            <h3 className={`text-2xl font-black tabular-nums ${item.label === 'Cartera Pend.' ? 'text-rose-600' : 'text-slate-800'}`}>
                                ${item.val.toLocaleString('es-CO')}
                            </h3>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Distribución */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col justify-between shadow-sm">
                    <div className="mb-10">
                        <h3 className="text-slate-800 font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-8">
                            <LayoutGrid size={16} className="text-slate-400" /> Recaudos Activos
                        </h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">En Bancos</span>
                                <span className="font-black text-slate-900 tabular-nums">${stats.banco.toLocaleString('es-CO')}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Efectivo</span>
                                <span className="font-black text-slate-900 tabular-nums">${stats.efectivo.toLocaleString('es-CO')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3">Eficiencia Recaudo</p>
                        <div className="text-3xl font-black text-slate-800 tabular-nums leading-none">
                            {stats.ingresosMes + stats.carteraPendiente > 0
                                ? Math.round((stats.ingresosMes / (stats.ingresosMes + stats.carteraPendiente)) * 100)
                                : 0}%
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN DEUDORES CRÍTICOS MEJORADA --- */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col shadow-sm relative overflow-hidden">
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-slate-800 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div> Unidades con Mayor Mora
                        </h3>
                        <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full uppercase tracking-wide">
                            Top 5 Crítico
                        </span>
                    </div>

                    <div className="space-y-3 flex-1 relative z-10">
                        {morosos.length === 0 ? (
                            <div className="py-20 text-center opacity-40">
                                <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={40} />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Excelente: Cartera al día</p>
                            </div>
                        ) : (
                            morosos.map((m, i) => (
                                <div key={i} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300">

                                    <div className="flex items-center gap-5">
                                        {/* Rank Badge */}
                                        <div className="w-8 flex justify-center">
                                            {renderRankIcon(i)}
                                        </div>

                                        {/* Avatar & Info */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-[10px] shadow-md group-hover:scale-110 transition-transform">
                                                {m.unidad}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase truncate max-w-[150px]">{m.nombre}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                                    <User size={10} /> {m.cantidadRecibos} Conceptos vencidos
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monto */}
                                    <div className="text-right">
                                        <p className="text-sm font-black text-rose-600 tabular-nums">
                                            ${Number(m.totalDeuda).toLocaleString('es-CO')}
                                        </p>
                                        <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-rose-500 rounded-full"
                                                style={{ width: `${Math.min(100, (m.totalDeuda / morosos[0].totalDeuda) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={goToDeudores}
                        className="w-full mt-8 py-4 bg-slate-50 border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                    >
                        Ver Cartera Completa <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}