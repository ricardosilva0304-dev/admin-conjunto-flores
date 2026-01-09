"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Users, Printer, FileText, 
  Loader2, X, CheckCircle2, TrendingUp, 
  ArrowUpRight, ArrowDownWideNarrow
} from "lucide-react";

// Importación de los dos documentos que se van a generar
import EstadoCuenta from "./EstadoCuenta";
import CuentaCobro from "./CuentaCobro";

export default function Deudores() {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTorre, setFiltroTorre] = useState("TODAS");
  const [orden, setOrden] = useState("mayor");
  
  // ESTADOS PARA LOS MODALES
  const [residenteDetalle, setResidenteDetalle] = useState<any>(null); // Para el Estado de Cuenta
  const [cobroResidente, setCobroResidente] = useState<any>(null);    // Para la Cuenta de Cobro

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

  // --- CÁLCULO DE DEUDA REAL DINÁMICA ---
  const calcularDeudaHoy = (resId: number) => {
    const deudasRes = deudas.filter(d => d.residente_id === resId);
    return deudasRes.reduce((acc, d) => {
      const hoy = new Date();
      const dia = hoy.getDate();
      const mesAct = hoy.getMonth() + 1;
      const anioAct = hoy.getFullYear();
      const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);

      let precioActual = d.precio_m1;
      if (anioAct > yC || (anioAct === yC && mesAct > mC)) precioActual = d.precio_m3;
      else {
        if (dia > 10 && dia <= 20) precioActual = d.precio_m2;
        if (dia > 20) precioActual = d.precio_m3;
      }

      const abonado = (d.monto_original || 0) - (d.saldo_pendiente || 0);
      return acc + Math.max(0, precioActual - abonado);
    }, 0);
  };

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

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={50} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-24">
      
      {/* 1. DOCUMENTOS DINÁMICOS (MODALES) */}
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

      {/* 2. KPIS DE CARTERA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 z-10 relative">Cartera Total Hoy</p>
           <h3 className="text-4xl font-black tracking-tighter text-emerald-400 tabular-nums z-10 relative">
             ${listaProcesada.reduce((acc, r) => acc + r.deudaTotal, 0).toLocaleString('es-CO')}
           </h3>
           <TrendingUp className="absolute right-0 bottom-0 text-white/5 translate-x-1/4 translate-y-1/4" size={160} />
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Unidades con Saldo</p>
           <h3 className="text-3xl font-black text-rose-600">
             {listaProcesada.filter(r => r.deudaTotal > 0).length} <span className="text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">Apartamentos</span>
           </h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Cartera Saneada</p>
              <h3 className="text-3xl font-black text-emerald-600">
                {listaProcesada.filter(r => r.deudaTotal === 0).length}
              </h3>
           </div>
           <CheckCircle2 className="text-emerald-100" size={56} strokeWidth={1} />
        </div>
      </div>

      {/* 3. BARRA DE HERRAMIENTAS (Filtros y Búsqueda) */}
      <section className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col xl:flex-row items-center gap-6">
        <div className="relative flex-1 w-full group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
           <input 
            placeholder="Buscar por unidad (ej: 5-101) o nombre..."
            className="w-full bg-slate-50 border border-slate-100 pl-14 pr-8 py-5 rounded-3xl font-bold text-slate-700 outline-none focus:ring-4 ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300"
            onChange={(e) => setBusqueda(e.target.value)}
           />
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-3xl gap-1 overflow-x-auto w-full xl:w-auto">
           {["TODAS", "Torre 1", "Torre 5", "Torre 6", "Torre 7", "Torre 8"].map(t => (
             <button 
                key={t}
                onClick={() => setFiltroTorre(t)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${filtroTorre === t ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600 uppercase"}`}
             >
               {t === "TODAS" ? "VER TODO" : t.replace("Torre ", "T-")}
             </button>
           ))}
        </div>

        <select 
          className="bg-slate-900 text-white px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] outline-none active:scale-95 transition-all appearance-none cursor-pointer text-center"
          onChange={(e) => setOrden(e.target.value)}
        >
          <option value="mayor">Por Mayor Deuda</option>
          <option value="menor">Por Menor Deuda</option>
        </select>
      </section>

      {/* 4. LISTADO TIPO CARD PREMIUM */}
      <div className="grid gap-3">
        {listaProcesada.map(res => (
          <div key={res.id} className="bg-white border border-slate-100 px-8 py-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between hover:shadow-xl hover:shadow-emerald-500/5 transition-all group border-b-4 border-b-transparent hover:border-b-emerald-100 relative">
            
            <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
              {/* BADGE DE UNIDAD CORREGIDO */}
              <div className={`w-24 h-16 rounded-[1.8rem] flex flex-col items-center justify-center font-black transition-all shadow-md shrink-0 border border-slate-100 ${res.deudaTotal > 0 ? "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-200/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                 <span className="text-[7px] uppercase opacity-60 tracking-[0.2em] mb-1 font-bold">Unidad</span>
                 <span className="text-xl tracking-tighter leading-none italic uppercase">T{res.torre.replace("Torre ","")}-{res.apartamento}</span>
              </div>
              
              <div className="truncate">
                <h4 className="text-slate-900 font-black text-lg tracking-tight uppercase group-hover:text-emerald-700 transition-colors truncate max-w-[200px] md:max-w-md">
                   {res.nombre}
                </h4>
                <div className="flex items-center gap-3 mt-1.5">
                   <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${res.deudaTotal > 0 ? "bg-rose-500/5 text-rose-500 border-rose-500/10" : "bg-emerald-500/5 text-emerald-500 border-emerald-500/10"}`}>
                      <div className={`w-1 h-1 rounded-full ${res.deudaTotal > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></div>
                      {res.deudaTotal > 0 ? "Pendiente" : "Paz y Salvo"}
                   </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end md:mr-16 my-4 md:my-0 w-full md:w-auto">
               <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-widest">Saldo Activo al día</p>
               <span className={`text-3xl font-black tabular-nums tracking-tighter ${res.deudaTotal > 0 ? "text-slate-900 underline decoration-rose-400 decoration-2 underline-offset-8" : "text-slate-200"}`}>
                 ${res.deudaTotal.toLocaleString('es-CO')}
               </span>
            </div>

            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
               <button 
                 onClick={() => setResidenteDetalle(res)} // <-- Botón Estado de Cuenta funcional
                 className="flex-1 md:flex-none px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] transition-all shadow-md active:scale-95 shadow-emerald-500/10"
               >
                 Estado Cuenta
               </button>
               <button 
                 onClick={() => setCobroResidente(res)}   // <-- CORRECCIÓN: Ahora vinculamos la Cuenta de Cobro aquí
                 className={`flex-1 md:flex-none px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] transition-all shadow-md ${res.deudaTotal > 0 ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 active:scale-95" : "bg-slate-50 text-slate-300 pointer-events-none opacity-40 grayscale"}`}
               >
                 Cuenta Cobro
               </button>
            </div>

          </div>
        ))}
      </div>
      
      {/* PIE DE PÁGINA */}
      <div className="py-2 text-center">
         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-relaxed">
            Gestión Integrada • Parque de las Flores
         </p>
      </div>

    </div>
  );
}