"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    TrendingUp, TrendingDown, Wallet, AlertTriangle,
    ArrowUpRight, Landmark, Banknote, Users,
    Clock, Calendar, ChevronRight, Loader2, CheckCircle2
} from "lucide-react";

export default function Resumen({ adminName }: { adminName: string }) {
    const [stats, setStats] = useState({
        ingresosMes: 0,
        egresosMes: 0,
        cajaTotal: 0,
        carteraPendiente: 0,
        banco: 0,
        efectivo: 0
    });
    const [morosos, setMorosos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { cargarDatosDashboard(); }, []);

    async function cargarDatosDashboard() {
        setLoading(true);
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();

        // 1. Ingresos del Mes (Sumar pagos)
        const { data: pagosMes } = await supabase.from("pagos").select("monto_total, metodo_pago").gte("fecha_pago", primerDiaMes);

        // 2. Egresos del Mes
        const { data: egresosMes } = await supabase.from("egresos").select("monto").gte("fecha", primerDiaMes);

        // 3. Cartera Pendiente (Suma de todos los saldos reales de deudas_residentes)
        // Para simplificar, traemos todas las deudas activas
        const { data: todasDeudas } = await supabase.from("deudas_residentes").select("saldo_pendiente").gt("saldo_pendiente", 0);

        // 4. Residentes en Mora (Top 5 con más deuda)
        const { data: listaMora } = await supabase
            .from("deudas_residentes")
            .select(`unidad, saldo_pendiente, residentes(nombre)`)
            .gt("saldo_pendiente", 0)
            .order('saldo_pendiente', { ascending: false })
            .limit(5);

        // Cálculos
        const ingTotal = pagosMes?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
        const egrTotal = egresosMes?.reduce((acc, e) => acc + Number(e.monto), 0) || 0;
        const cartera = todasDeudas?.reduce((acc, d) => acc + Number(d.saldo_pendiente), 0) || 0;
        const banco = pagosMes?.filter(p => p.metodo_pago === 'Transferencia').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
        const efectivo = pagosMes?.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;

        setStats({
            ingresosMes: ingTotal,
            egresosMes: egrTotal,
            cajaTotal: ingTotal - egrTotal, // Simplificado a balance del mes
            carteraPendiente: cartera,
            banco,
            efectivo
        });
        setMorosos(listaMora || []);
        setLoading(false);
    }

    // Saludo dinámico
    const getSaludo = () => {
        const hora = new Date().getHours();
        if (hora < 12) return "¡Buenos días!";
        if (hora < 18) return "¡Buenas tardes!";
        return "¡Buenas noches!";
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">

            {/* HEADER DINÁMICO */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-slate-900 text-5xl font-black tracking-tighter mb-2 italic uppercase">
                        {getSaludo()}
                    </h1>
                    <div className="text-slate-400 font-bold text-sm uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-8 h-[2px] bg-emerald-500"></div>
                        <span>Estado actual de Parque de las Flores</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 px-6 py-4 rounded-[1.5rem] shadow-sm flex items-center gap-4">
                    <Calendar className="text-emerald-500" size={20} />
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Periodo Actual</p>
                        <p className="text-slate-900 font-black text-sm uppercase">{new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date())}</p>
                    </div>
                </div>
            </div>

            {/* KPI GRID - TARJETAS PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ingresos Mes', val: stats.ingresosMes, icon: <TrendingUp />, color: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
                    { label: 'Egresos Mes', val: stats.egresosMes, icon: <TrendingDown />, color: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50' },
                    { label: 'Balance Caja', val: stats.cajaTotal, icon: <Wallet />, color: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
                    { label: 'Cartera Total', val: stats.carteraPendiente, icon: <AlertTriangle />, color: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                        <div className={`w-12 h-12 ${item.light} ${item.text} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                            {item.icon}
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{item.label}</p>
                        <h3 className="text-slate-900 text-3xl font-black tracking-tighter tabular-nums">
                            ${item.val.toLocaleString()}
                        </h3>
                        <div className={`absolute bottom-0 right-0 w-24 h-24 ${item.color} opacity-[0.03] -mr-8 -mb-8 rounded-full`}></div>
                    </div>
                ))}
            </div>

            {/* SECCIÓN INFERIOR: DETALLES Y MORA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ESTADO FINANCIERO (Bancos vs Efectivo) */}
                <div className="lg:col-span-1 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                            Distribución
                        </h3>

                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl"><Landmark size={20} className="text-emerald-400" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bancos</p>
                                        <p className="font-black text-lg">${stats.banco.toLocaleString()}</p>
                                    </div>
                                </div>
                                <ArrowUpRight size={20} className="text-slate-700" />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl"><Banknote size={20} className="text-blue-400" /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efectivo</p>
                                        <p className="font-black text-lg">${stats.efectivo.toLocaleString()}</p>
                                    </div>
                                </div>
                                <ArrowUpRight size={20} className="text-slate-700" />
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Meta de Recaudo</p>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-1000"
                                    style={{ width: `${(stats.ingresosMes / (stats.ingresosMes + stats.carteraPendiente)) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-right text-[10px] mt-2 font-bold text-slate-400">
                                {Math.round((stats.ingresosMes / (stats.ingresosMes + stats.carteraPendiente)) * 100) || 0}% recaudado
                            </p>
                        </div>
                    </div>
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full -mr-32 -mt-32"></div>
                </div>

                {/* LISTADO DE MOROSOS */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-slate-900 text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="w-2 h-6 bg-rose-500 rounded-full"></div>
                            Cartera en Mora
                        </h3>
                        <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Pendientes Críticos</span>
                    </div>

                    {/* LISTADO DE MOROSOS REDISEÑADO */}
                    <div className="space-y-3">
                        {morosos.length === 0 ? (
                            <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">¡Felicidades! Todo el conjunto está al día.</p>
                            </div>
                        ) : (
                            morosos.map((m, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 rounded-[2rem] transition-all border border-slate-100 shadow-sm hover:shadow-md group">
                                    <div className="flex items-center gap-6">

                                        {/* EL NUEVO BADGE DE UNIDAD - ESTILO PREMIUM */}
                                        <div className="w-20 h-16 bg-slate-900 rounded-[1.5rem] flex flex-col items-center justify-center shadow-lg group-hover:bg-rose-600 transition-all duration-500 border border-white/5 shrink-0">
                                            <span className="text-[8px] font-black text-slate-500 group-hover:text-rose-200 uppercase tracking-widest leading-none mb-1">Unidad</span>
                                            <span className="text-white font-black text-lg tracking-tighter leading-none">{m.unidad}</span>
                                        </div>

                                        <div>
                                            <p className="text-slate-900 font-black text-sm uppercase tracking-tight leading-none mb-1.5">{m.residentes?.nombre}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">Deuda Vencida</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right pr-4">
                                        <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-widest">Saldo Total</p>
                                        <div className="flex items-baseline justify-end gap-1">
                                            <span className="text-rose-600 font-black text-2xl tabular-nums tracking-tighter">
                                                ${m.saldo_pendiente.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button className="w-full mt-8 py-4 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center gap-2">
                        Ver reporte completo <ChevronRight size={14} />
                    </button>
                </div>

            </div>

        </div>
    );
}