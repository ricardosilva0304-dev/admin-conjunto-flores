"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    TrendingUp, TrendingDown, Wallet, AlertTriangle,
    ArrowUpRight, Landmark, Banknote, Users,
    Clock, Calendar, ChevronRight, Loader2, CheckCircle2
} from "lucide-react";

interface ResumenProps {
    adminName: string;
    goToDeudores: () => void;
}

export default function Resumen({ adminName, goToDeudores }: ResumenProps) {
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

        // 3. Cartera Pendiente (Suma de todos los saldos)
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
            cajaTotal: ingTotal - egrTotal,
            carteraPendiente: cartera,
            banco,
            efectivo
        });
        setMorosos(listaMora || []);
        setLoading(false);
    }

    const getSaludo = () => {
        const hora = new Date().getHours();
        if (hora < 12) return "¡Buenos días!";
        if (hora < 18) return "¡Buenas tardes!";
        return "¡Buenas noches!";
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={50} /></div>;

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
                        <span>ESTADO ACTUAL DE PARQUE DE LAS FLORES</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-100 px-6 py-4 rounded-[1.5rem] shadow-sm flex items-center gap-4">
                    <Calendar className="text-emerald-500" size={20} />
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Periodo Mensual</p>
                        <p className="text-slate-900 font-black text-sm uppercase">
                            {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date())}
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ingresos Mes', val: stats.ingresosMes, icon: <TrendingUp />, light: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
                    { label: 'Egresos Mes', val: stats.egresosMes, icon: <TrendingDown />, light: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
                    { label: 'Balance Mes', val: stats.cajaTotal, icon: <Wallet />, light: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
                    { label: 'Cartera Pend.', val: stats.carteraPendiente, icon: <AlertTriangle />, light: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className={`w-12 h-12 ${item.light} ${item.text} rounded-2xl flex items-center justify-center mb-6`}>
                            {item.icon}
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{item.label}</p>
                        <h3 className="text-slate-900 text-3xl font-black tracking-tighter tabular-nums">${item.val.toLocaleString()}</h3>
                        <div className={`absolute bottom-0 right-0 w-2 h-2 ${item.dot} rounded-full m-8 opacity-20`}></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* DISTRIBUCIÓN DE FONDOS */}
                <div className="lg:col-span-1 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div> Distribución
                        </h3>
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl text-emerald-400"><Landmark size={20} /></div>
                                    <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bancos</p><p className="font-black text-lg">${stats.banco.toLocaleString()}</p></div>
                                </div>
                                <ArrowUpRight size={20} className="text-slate-700" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl text-blue-400"><Banknote size={20} /></div>
                                    <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efectivo</p><p className="font-black text-lg">${stats.efectivo.toLocaleString()}</p></div>
                                </div>
                                <ArrowUpRight size={20} className="text-slate-700" />
                            </div>
                        </div>
                        <div className="mt-12 p-6 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Progreso del Mes</p>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-1000" 
                                style={{ width: `${Math.min(100, (stats.ingresosMes / (stats.ingresosMes + stats.carteraPendiente + 1)) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARTERA EN MORA */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-slate-900 text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="w-2 h-6 bg-rose-500 rounded-full"></div> Cartera en Mora
                        </h3>
                        <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Pendientes Críticos</span>
                    </div>

                    <div className="space-y-3 flex-1">
                        {morosos.length === 0 ? (
                            <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 h-full flex flex-col justify-center items-center">
                                <CheckCircle2 size={40} className="text-emerald-500 mb-4" />
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">¡Felicidades! Conjunto al día.</p>
                            </div>
                        ) : (
                            morosos.map((m, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-[2rem] transition-all border border-slate-100 shadow-sm group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-12 bg-slate-900 rounded-[1.2rem] flex flex-col items-center justify-center group-hover:bg-rose-600 transition-all">
                                            <span className="text-[7px] font-black text-slate-500 group-hover:text-white uppercase mb-0.5">UNIDAD</span>
                                            <span className="text-white font-black text-base">{m.unidad}</span>
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-black text-sm uppercase">{m.residentes?.nombre}</p>
                                            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">En Mora</p>
                                        </div>
                                    </div>
                                    <div className="text-right px-4">
                                        <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Deuda</p>
                                        <span className="text-rose-600 font-black text-xl tabular-nums">${m.saldo_pendiente.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={goToDeudores}
                        className="w-full mt-8 py-5 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] rounded-[1.5rem] hover:bg-slate-900 hover:text-white hover:tracking-[0.6em] transition-all duration-500 flex items-center justify-center gap-3 border border-slate-100"
                    >
                        VER REPORTE COMPLETO <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}