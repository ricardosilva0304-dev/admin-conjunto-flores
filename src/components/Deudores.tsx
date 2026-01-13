"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Users, Printer, FileText, 
  Loader2, X, CheckCircle2, TrendingUp, 
  ArrowUpRight, LayoutGrid, Building2, User,
  Mail, Phone
} from "lucide-react";

// Documentos
import EstadoCuenta from "./EstadoCuenta";
import CuentaCobro from "./CuentaCobro";

export default function Deudores() {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTorre, setFiltroTorre] = useState("TODAS");
  const [orden, setOrden] = useState("mayor");
  
  const [residenteDetalle, setResidenteDetalle] = useState<any>(null); 
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

  // --- CÁLCULO DINÁMICO POR TRAMOS ---
  const calcularDeudaReal = (resId: number) => {
    const deudasRes = deudas.filter(d => d.residente_id === resId);
    return deudasRes.reduce((acc, d) => {
      const hoy = new Date();
      const dia = hoy.getDate();
      const mesAct = hoy.getMonth() + 1;
      const anioAct = hoy.getFullYear();
      const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);

      let precioPlazo = d.precio_m1;
      if (anioAct > yC || (anioAct === yC && mesAct > mC)) precioPlazo = d.precio_m3;
      else {
        if (dia > 10 && dia <= 20) precioPlazo = d.precio_m2;
        if (dia > 20) precioPlazo = d.precio_m3;
      }
      // Restar lo ya abonado
      const abonado = (d.monto_original || 0) - (d.saldo_pendiente || 0);
      return acc + Math.max(0, precioPlazo - abonado);
    }, 0);
  };

  const lista = residentes.map(r => ({
    ...r,
    saldoReal: calcularDeudaReal(r.id)
  })).filter(r => {
    const term = busqueda.toLowerCase().trim();
    const coincideTorre = filtroTorre === "TODAS" || r.torre === filtroTorre;
    if (!term) return coincideTorre;
    if (term.includes("-")) {
        const [t, a] = term.split("-");
        return r.torre.includes(t) && r.apartamento.startsWith(a) && coincideTorre;
    }
    return (r.nombre.toLowerCase().includes(term) || r.apartamento.includes(term)) && coincideTorre;
  }).sort((a, b) => orden === "mayor" ? b.saldoReal - a.saldoReal : a.saldoReal - b.saldoReal);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans text-slate-800">
      
      {/* 1. KPIS SIMPLES Y ELEGANTES */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-slate-900 p-6 rounded-xl text-white">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Total en Calle</p>
           <h3 className="text-2xl md:text-3xl font-black tabular-nums text-emerald-400">
             ${lista.reduce((acc, r) => acc + r.saldoReal, 0).toLocaleString('es-CO')}
           </h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 text-center md:text-left">Unidades con Mora</p>
           <h3 className="text-2xl md:text-3xl font-black text-rose-500 text-center md:text-left">
             {lista.filter(r => r.saldoReal > 0).length}
           </h3>
        </div>
        <div className="hidden md:flex bg-white p-6 rounded-xl border border-slate-200 items-center justify-between">
           <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Paz y Salvo</p>
              <h3 className="text-3xl font-black text-emerald-600">
                {lista.filter(r => r.saldoReal === 0).length}
              </h3>
           </div>
           <CheckCircle2 className="text-emerald-100" size={36} />
        </div>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS MÓVIL-OPTIMIZADA */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="relative flex-1 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
           <input 
            placeholder="Buscar por apto o nombre..."
            className="w-full bg-transparent pl-11 pr-4 py-4 font-bold text-slate-700 outline-none placeholder:text-slate-300"
            onChange={(e) => setBusqueda(e.target.value)}
           />
        </div>
        
        <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar md:bg-slate-50 md:rounded-xl">
           {["TODAS", "1", "5", "6", "7", "8"].map(t => (
             <button 
                key={t}
                onClick={() => setFiltroTorre(t === "TODAS" ? "TODAS" : `Torre ${t}`)}
                className={`px-5 py-2.5 rounded-lg text-[9px] font-black transition-all ${
                  (filtroTorre === "TODAS" && t === "TODAS") || filtroTorre === `Torre ${t}` 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-400"
                }`}
             >
               {t === "TODAS" ? "VER TODAS" : `T${t}`}
             </button>
           ))}
        </div>
      </div>

      {/* 3. LISTADO EJECUTIVO */}
      <div className="space-y-2 md:space-y-3">
        {lista.map(res => (
          <div key={res.id} className="bg-white border border-slate-100 p-4 md:p-6 rounded-xl md:rounded-2xl flex flex-col md:flex-row md:items-center justify-between transition-all hover:bg-slate-50">
            
            <div className="flex items-center gap-5 md:w-1/3 mb-4 md:mb-0">
              <div className={`w-14 h-12 rounded-lg flex flex-col items-center justify-center font-black ${res.saldoReal > 0 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                 <span className="text-[7px] uppercase font-bold mb-0.5">UNIDAD</span>
                 <span className="text-sm">T{res.torre.replace("Torre ","")}-{res.apartamento}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-slate-800 font-bold text-sm uppercase truncate max-w-[150px]">{res.nombre}</h4>
                <div className="flex items-center gap-2 mt-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${res.saldoReal > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></div>
                   <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                     {res.saldoReal > 0 ? "Tiene Pendientes" : "Al día"}
                   </p>
                </div>
              </div>
            </div>

            <div className="text-right flex items-center md:flex-col justify-between md:justify-center border-t md:border-t-0 md:border-x border-slate-100 pt-3 md:pt-0 md:px-10 mb-4 md:mb-0">
               <p className="text-[9px] font-black text-slate-400 uppercase md:mb-1 tracking-widest">Saldo Real Hoy</p>
               <span className={`text-xl md:text-2xl font-black tabular-nums tracking-tighter ${res.saldoReal > 0 ? "text-rose-600" : "text-slate-200"}`}>
                 ${res.saldoReal.toLocaleString('es-CO')}
               </span>
            </div>

            <div className="flex gap-2">
               <button 
                 onClick={() => setResidenteDetalle(res)}
                 className="flex-1 md:flex-none px-6 py-3 border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95"
               >
                 Estado Cuenta
               </button>
               <button 
                 onClick={() => setCobroResidente(res)}
                 className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${res.saldoReal > 0 ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-300 pointer-events-none"}`}
               >
                 Cuenta Cobro
               </button>
            </div>

          </div>
        ))}
      </div>

      {/* MODALES TÁCTILES */}
      {residenteDetalle && (
        <EstadoCuenta residente={residenteDetalle} deudas={deudas.filter(d => d.residente_id === residenteDetalle.id)} onClose={() => setResidenteDetalle(null)} />
      )}
      {cobroResidente && (
        <CuentaCobro residente={cobroResidente} deudas={deudas.filter(d => d.residente_id === cobroResidente.id)} onClose={() => setCobroResidente(null)} />
      )}
    </div>
  );
}