"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Trash2, Edit, X, Loader2, 
  Percent, Info, Settings, MoreVertical 
} from "lucide-react";

export default function Configuracion() {
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [tasaMora, setTasaMora] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nuevo, setNuevo] = useState({ nombre: "", porVehiculo: "No", m1: "", m2: "", m3: "" });

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setLoading(true);
    try {
      const { data: cData } = await supabase.from("conceptos_pago").select("*").order('id', { ascending: true });
      if (cData) setConceptos(cData);
      const { data: gData } = await supabase.from("configuracion_global").select("tasa_mora").eq("id", 1).single();
      if (gData) setTasaMora(gData.tasa_mora.toString());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function guardarConcepto(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevo.nombre || !nuevo.m1) return;

    const datos = {
      nombre: nuevo.nombre.toUpperCase(),
      cobro_por_vehiculo: nuevo.porVehiculo === "Si",
      monto_1_10: parseFloat(nuevo.m1),
      monto_11_20: parseFloat(nuevo.m2 || nuevo.m1),
      monto_21_adelante: parseFloat(nuevo.m3 || nuevo.m1)
    };

    if (editandoId) await supabase.from("conceptos_pago").update(datos).eq("id", editandoId);
    else await supabase.from("conceptos_pago").insert([datos]);
    
    setShowModal(false);
    cargarDatos();
  }

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={30} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      
      {/* 1. HEADER SECCIÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
           <h1 className="text-slate-800 text-xl font-bold flex items-center gap-2">
             <Settings size={18} className="text-slate-400" />
             PARÁMETROS FINANCIEROS
           </h1>
           <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-medium">Control de tarifas y recargos</p>
        </div>
        <button 
          onClick={() => { setEditandoId(null); setNuevo({nombre:"", porVehiculo:"No", m1:"", m2:"", m3:""}); setShowModal(true); }}
          className="w-full sm:w-auto bg-slate-900 text-white px-5 py-3 rounded-lg text-xs font-black tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={16} /> NUEVO CONCEPTO
        </button>
      </div>

      {/* 2. CATÁLOGO DE CONCEPTOS */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicios y Cobranza</span>
          <span className="text-[10px] font-bold text-slate-500">{conceptos.length} Items configurados</span>
        </div>

        {/* VISTA DESKTOP: TABLA LIMPIA */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100 bg-slate-50/20">
                <th className="px-6 py-4">Concepto</th>
                <th className="px-6 py-4">Filtro</th>
                <th className="px-6 py-4 text-center">Tramo 1-10</th>
                <th className="px-6 py-4 text-center">Tramo 11-20</th>
                <th className="px-6 py-4 text-center">Tramo 21+</th>
                <th className="px-6 py-4 text-right">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {conceptos.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{c.nombre}</td>
                  <td className="px-6 py-4">
                     <span className={`text-[9px] px-2 py-1 rounded font-black ${c.cobro_por_vehiculo ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                       {c.cobro_por_vehiculo ? "C. VARIABLE" : "C. FIJO"}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-emerald-600 tabular-nums">${Number(c.monto_1_10).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-500 tabular-nums">${Number(c.monto_11_20).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-medium text-rose-500 tabular-nums">${Number(c.monto_21_adelante).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditandoId(c.id); setNuevo({nombre:c.nombre, porVehiculo: c.cobro_por_vehiculo ? "Si" : "No", m1:c.monto_1_10.toString(), m2:c.monto_11_20.toString(), m3:c.monto_21_adelante.toString()}); setShowModal(true); }} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL: TARJETAS CÓMODAS */}
        <div className="md:hidden divide-y divide-slate-100 bg-[#F8FAFC]">
           {conceptos.map((c) => (
              <div key={c.id} className="p-5 flex flex-col gap-4 bg-white">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="font-black text-slate-900 leading-tight">{c.nombre}</p>
                       <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{c.cobro_por_vehiculo ? "Por unidad de vehículo" : "Monto único fijo"}</p>
                    </div>
                    <button onClick={() => { setEditandoId(c.id); setNuevo({nombre:c.nombre, porVehiculo: c.cobro_por_vehiculo ? "Si" : "No", m1:c.monto_1_10.toString(), m2:c.monto_11_20.toString(), m3:c.monto_21_adelante.toString()}); setShowModal(true); }} className="p-3 bg-slate-50 rounded-lg"><Edit size={16}/></button>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-emerald-50 rounded-lg text-center border border-emerald-100">
                       <span className="text-[8px] text-emerald-500 font-black block">1-10</span>
                       <span className="text-xs font-black text-emerald-700 tabular-nums">${Number(c.monto_1_10).toLocaleString()}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
                       <span className="text-[8px] text-slate-400 font-black block">11-20</span>
                       <span className="text-xs font-black text-slate-700 tabular-nums">${Number(c.monto_11_20).toLocaleString()}</span>
                    </div>
                    <div className="p-2 bg-rose-50 rounded-lg text-center border border-rose-100">
                       <span className="text-[8px] text-rose-400 font-black block">21+</span>
                       <span className="text-xs font-black text-rose-700 tabular-nums">${Number(c.monto_21_adelante).toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>

      {/* 3. TASA DE MORA */}
      <section className="bg-white p-8 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-2">
            <h3 className="text-slate-900 font-bold flex items-center gap-2">
              <Percent size={18} className="text-amber-500" /> Interés por Mora
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed uppercase tracking-wider font-medium">Este porcentaje penaliza las deudas de meses anteriores sobre el saldo vencido actual.</p>
          </div>
          
          <div className="w-full md:w-64 relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">%</span>
            <input 
              type="number" step="0.1" value={tasaMora}
              onChange={async (e) => { setTasaMora(e.target.value); await supabase.from("configuracion_global").update({ tasa_mora: parseFloat(e.target.value) }).eq("id", 1); }}
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-black text-xl text-center outline-none focus:border-amber-400 focus:bg-white transition-all tabular-nums"
            />
          </div>
      </section>

      {/* MODAL CONFIG (FULL RESPONSIVE) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 z-[110] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <form onSubmit={guardarConcepto} className="p-8">
              <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-slate-900 text-xl font-bold tracking-tight">{editandoId ? "Editar Configuración" : "Nuevo Servicio"}</h3>
                   <p className="text-slate-400 text-xs mt-1 uppercase font-black">Detalle de facturación mensual</p>
                </div>
                <button type="button" onClick={()=>setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-300"><X /></button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] ml-1">Nombre Concepto</label>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:ring-4 ring-emerald-500/5 font-bold uppercase" value={nuevo.nombre} onChange={(e)=>setNuevo({...nuevo, nombre: e.target.value})} required placeholder="ADMINISTRACIÓN" />
                </div>

                <div>
                  <label className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] ml-1">Modalidad de cobro</label>
                  <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 mt-1">
                    {['No', 'Si'].map(opt => (
                       <button key={opt} type="button" onClick={()=>setNuevo({...nuevo, porVehiculo: opt})} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${nuevo.porVehiculo === opt ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400"}`}>
                         {opt === 'No' ? 'VALOR FIJO' : 'VALOR X VEHÍCULO'}
                       </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[{t:'Día 1-10',f:'m1',c:'emerald'},{t:'Día 11-20',f:'m2',c:'slate'},{t:'Día 21+',f:'m3',c:'rose'}].map(item => (
                    <div key={item.f} className="space-y-1">
                      <label className="text-slate-400 text-[8px] font-black uppercase ml-1">{item.t}</label>
                      <input type="number" className={`w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-100 tabular-nums focus:border-${item.c}-500`} value={nuevo[item.f as keyof typeof nuevo]} onChange={(e)=>setNuevo({...nuevo, [item.f]: e.target.value})} required />
                    </div>
                  ))}
                </div>

                {editandoId && (
                   <button type="button" onClick={async () => { if(confirm("¿Eliminar para siempre?")) { await supabase.from("conceptos_pago").delete().eq("id", editandoId); setShowModal(false); cargarDatos(); }}} className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] w-full text-center hover:text-rose-600 transition-colors py-4">Eliminar Servicio definitivamente</button>
                )}

                <div className="flex gap-3 mt-6">
                   <button type="submit" className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-[0.1em] hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20 transition-all">Guardar Datos</button>
                   <button type="button" onClick={()=>setShowModal(false)} className="px-6 bg-slate-50 text-slate-500 font-bold py-4 rounded-xl text-xs uppercase">Cerrar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}