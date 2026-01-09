"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, Users, AlertCircle, Printer, FileText,
  Plus, Loader2, X, ChevronRight, TrendingUp,
  Filter, ArrowDownNarrowWide, Phone, Mail, Building2, CheckCircle2
} from "lucide-react";
import EstadoCuenta from "./EstadoCuenta"; // Crearemos este abajo
import CuentaCobro from "./CuentaCobro";

export default function Deudores() {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTorre, setFiltroTorre] = useState("TODAS");
  const [orden, setOrden] = useState("mayor");

  const [residenteDetalle, setResidenteDetalle] = useState<any>(null); // Para el Estado de Cuenta
  const [cobroResidente, setCobroResidente] = useState<any>(null);

  useEffect(() => { cargarInformacion(); }, []);

  async function cargarInformacion() {
    setLoading(true);
    const { data: resData } = await supabase.from("residentes").select("*");
    const { data: deudasData } = await supabase
      .from("deudas_residentes")
      .select(`*, causaciones_globales(mes_causado)`)
      .gt("saldo_pendiente", 0);

    if (resData) setResidentes(resData);
    if (deudasData) setDeudas(deudasData);
    setLoading(false);
  }

  // --- LÓGICA DE CÁLCULO DE DEUDA REAL (Dinámica por fecha) ---
  const calcularDeudaHoy = (resId: number) => {
    const deudasRes = deudas.filter(d => d.residente_id === resId);
    return deudasRes.reduce((acc, d) => {
      const hoy = new Date();
      const dia = hoy.getDate();
      const mesAct = hoy.getMonth() + 1;
      const anioAct = hoy.getFullYear();
      const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);

      // Tarifa según fecha
      let precioActual = d.precio_m1;
      if (anioAct > yC || (anioAct === yC && mesAct > mC)) precioActual = d.precio_m3;
      else {
        if (dia > 10 && dia <= 20) precioActual = d.precio_m2;
        if (dia > 20) precioActual = d.precio_m3;
      }

      const abonado = d.monto_original - d.saldo_pendiente;
      return acc + Math.max(0, precioActual - abonado);
    }, 0);
  };

  // --- FILTRADO Y ORDEN ---
  const listaProcesada = residentes.map(r => ({
    ...r,
    deudaTotal: calcularDeudaHoy(r.id)
  })).filter(r => {
    const term = busqueda.toLowerCase().trim();
    const cumpleTorre = filtroTorre === "TODAS" || r.torre === filtroTorre;
    if (term.includes("-")) {
      const [t, a] = term.split("-");
      return r.torre.includes(t) && r.apartamento.startsWith(a) && cumpleTorre;
    }
    return (r.nombre.toLowerCase().includes(term) || r.apartamento.includes(term)) && cumpleTorre;
  }).sort((a, b) => orden === "mayor" ? b.deudaTotal - a.deudaTotal : a.deudaTotal - b.deudaTotal);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">

      {/* 1. DASHBOARD DE CARTERA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Deuda Global Hoy</p>
          <h3 className="text-4xl font-black tracking-tighter text-emerald-400">
            ${listaProcesada.reduce((acc, r) => acc + r.deudaTotal, 0).toLocaleString('es-CO')}
          </h3>
          <TrendingUp className="absolute right-6 top-8 text-white/5" size={80} />
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Unidades en Mora</p>
          <h3 className="text-3xl font-black text-rose-600">
            {listaProcesada.filter(r => r.deudaTotal > 0).length} <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">Apts</span>
          </h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Paz y Salvo</p>
            <h3 className="text-3xl font-black text-emerald-600">
              {listaProcesada.filter(r => r.deudaTotal === 0).length}
            </h3>
          </div>
          <CheckCircle2 className="text-emerald-100" size={48} />
        </div>
      </div>

      {/* 2. BARRA DE FILTROS PREMIUM */}
      <section className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input
            placeholder="Buscar por unidad (5-101) o nombre..."
            className="w-full bg-slate-50 border-none pl-14 pr-4 py-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 ring-emerald-500/5 transition-all"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto p-1 bg-slate-50 rounded-2xl">
          {["TODAS", "Torre 1", "Torre 5", "Torre 6", "Torre 7", "Torre 8"].map(t => (
            <button
              key={t}
              onClick={() => setFiltroTorre(t)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${filtroTorre === t ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}
            >
              {t === "TODAS" ? "TODAS" : t.replace("Torre ", "T")}
            </button>
          ))}
        </div>

        <select
          className="bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none active:scale-95 transition-all"
          onChange={(e) => setOrden(e.target.value)}
        >
          <option value="mayor">Ordenar: Mayor Deuda</option>
          <option value="menor">Ordenar: Menor Deuda</option>
        </select>
      </section>

      {/* 3. LISTADO DE CARTERA */}
      <div className="space-y-3">
        {listaProcesada.map(res => (
          <div key={res.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] flex items-center justify-between hover:shadow-xl hover:shadow-slate-200/40 transition-all group">

            <div className="flex items-center gap-6 w-1/3">
              <div className={`w-16 h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all shadow-lg ${res.deudaTotal > 0 ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white"}`}>
                <span className="text-[8px] uppercase opacity-60">Unidad</span>
                <span className="text-base tracking-tighter">{res.torre.replace("Torre ", "")}-{res.apartamento}</span>
              </div>
              <div className="truncate">
                <h4 className="text-slate-900 font-black text-sm truncate uppercase tracking-tight">{res.nombre}</h4>
                <div className={`flex items-center gap-2 mt-1 ${res.deudaTotal > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse bg-current`}></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">{res.deudaTotal > 0 ? "Estado: En Mora" : "Estado: Al día"}</p>
                </div>
              </div>
            </div>

            <div className="text-center w-1/4">
              <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Deuda Pendiente</p>
              <span className={`text-2xl font-black tabular-nums tracking-tighter ${res.deudaTotal > 0 ? "text-rose-600" : "text-slate-200"}`}>
                ${res.deudaTotal.toLocaleString('es-CO')}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setResidenteDetalle(res)}
                className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
              >
                Estado de Cuenta
              </button>
              <button
                onClick={() => alert("Generando Cuenta de Cobro...")}
                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${res.deudaTotal > 0 ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-slate-50 text-slate-300 pointer-events-none opacity-50"}`}
              >
                Cuenta de Cobro
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ESTADO DE CUENTA */}
      {residenteDetalle && (
        <EstadoCuenta
          residente={residenteDetalle}
          deudas={deudas.filter(d => d.residente_id === residenteDetalle.id)}
          onClose={() => setResidenteDetalle(null)}
        />
      )}

      {cobroResidente && (
        <CuentaCobro
          residente={cobroResidente}
          deudas={deudas.filter(d => d.residente_id === cobroResidente.id)}
          onClose={() => setCobroResidente(null)}
        />
      )}

    </div>
  );
}