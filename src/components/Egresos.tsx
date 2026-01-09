"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Search, Trash2, Printer, 
  TrendingDown, Loader2, X, CheckCircle2, 
  ArrowRight, Landmark, Banknote, User, Receipt, Filter, Calendar
} from "lucide-react";
import ComprobanteEgreso from "./ComprobanteEgreso";

export default function Egresos() {
  const [egresos, setEgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [egresoSeleccionado, setEgresoSeleccionado] = useState<any>(null);
  const [procesando, setProcesando] = useState(false);

  // Estado del Formulario
  const [form, setForm] = useState({
    recibo_n: "", concepto: "", pagado_a: "", monto: "", 
    fecha: new Date().toISOString().split('T')[0], metodo: "Transferencia"
  });

  useEffect(() => { cargarEgresos(); }, []);

  async function cargarEgresos() {
    setLoading(true);
    const { data } = await supabase.from("egresos").select("*").order('created_at', { ascending: false });
    if (data) setEgresos(data);
    setLoading(false);
  }

  // --- AUTOMATIZACIÓN DE NÚMERO DE RECIBO ---
  async function sugerirSiguienteEgreso() {
    const { data } = await supabase
      .from("egresos")
      .select("recibo_n")
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const ultimoNumeroStr = data[0].recibo_n?.replace(/\D/g, "") || "0";
      const siguiente = parseInt(ultimoNumeroStr) + 1;
      setForm(prev => ({ ...prev, recibo_n: siguiente.toString() }));
    } else {
      setForm(prev => ({ ...prev, recibo_n: "1" }));
    }
  }

  async function guardarEgreso(e: React.FormEvent) {
    e.preventDefault();
    if (!form.concepto || !form.monto || !form.pagado_a || !form.recibo_n) return alert("Completa los datos obligatorios");
    setProcesando(true);

    const { error } = await supabase.from("egresos").insert([{
      recibo_n: form.recibo_n,
      concepto: form.concepto,
      pagado_a: form.pagado_a,
      monto: parseFloat(form.monto),
      fecha: form.fecha,
      metodo_pago: form.metodo
    }]);

    if (!error) {
      setShowModal(false);
      cargarEgresos();
    } else {
      alert("Error: " + error.message);
    }
    setProcesando(false);
  }

  const egresosFiltrados = egresos.filter(e => {
    const cumpleBusqueda = e.concepto.toLowerCase().includes(busqueda.toLowerCase()) || e.pagado_a.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleMes = !filtroMes || e.fecha.startsWith(filtroMes);
    return cumpleBusqueda && cumpleMes;
  });

  const totalGastado = egresosFiltrados.reduce((acc, e) => acc + Number(e.monto), 0);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* 1. BARRA DE CONTROL PREMIUM */}
      <section className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center gap-4">
        
        {/* Buscador Integrado */}
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={20} />
          <input 
            placeholder="Buscar por concepto o proveedor..."
            className="w-full bg-slate-50 border-none pl-14 pr-6 py-5 rounded-[1.8rem] font-bold text-slate-700 outline-none focus:ring-4 ring-rose-500/5 transition-all"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Filtro Mes y Acción */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <input 
              type="month" 
              className="bg-white border-2 border-slate-100 px-6 py-4 rounded-2xl outline-none font-black text-xs text-slate-500 uppercase tracking-tighter"
              onChange={(e) => setFiltroMes(e.target.value)}
            />
          </div>

          <button 
            onClick={() => {
              setForm({ recibo_n: "", concepto: "", pagado_a: "", monto: "", fecha: new Date().toISOString().split('T')[0], metodo: "Transferencia" });
              setShowModal(true);
              sugerirSiguienteEgreso();
            }}
            className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-3xl font-black text-xs tracking-[0.1em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
          >
            <Plus size={18} /> REGISTRAR GASTO
          </button>
        </div>
      </section>

      {/* 2. SUMMARY KPI (Horizontal sutil) */}
      <div className="flex items-center justify-between px-6 bg-rose-50/50 p-6 rounded-[2.5rem] border border-rose-100">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
               <TrendingDown size={20} />
            </div>
            <div>
               <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-0.5">Egreso en Periodo Seleccionado</p>
               <h3 className="text-2xl font-black text-rose-700 tabular-nums">${totalGastado.toLocaleString('es-CO')}</h3>
            </div>
         </div>
         <p className="text-[10px] font-bold text-rose-400 uppercase italic opacity-60">{egresosFiltrados.length} Movimientos de caja</p>
      </div>

      {/* 3. HISTORIAL TIPO LISTA EJECUTIVA */}
      <div className="space-y-4">
        {egresosFiltrados.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-100 italic text-slate-400">Sin movimientos que coincidan con la búsqueda.</div>
        ) : (
          egresosFiltrados.map((e) => (
            <div key={e.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center justify-between hover:shadow-xl hover:shadow-rose-500/5 transition-all group border-b-4 border-b-transparent hover:border-b-rose-100">
              
              <div className="flex items-center gap-6 w-1/2">
                <div className="w-16 h-12 bg-slate-900 rounded-[1.25rem] flex flex-col items-center justify-center group-hover:bg-rose-600 transition-colors shadow-lg border border-white/5">
                   <span className="text-[7px] font-black text-slate-500 group-hover:text-rose-200 uppercase leading-none mb-1">Folio</span>
                   <span className="text-white font-black text-sm">#{e.recibo_n || e.id}</span>
                </div>
                <div className="truncate pr-4">
                  <h4 className="text-slate-900 font-black text-sm uppercase tracking-tighter truncate leading-none mb-2">{e.concepto}</h4>
                  <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5"><User size={12}/> {e.pagado_a}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={12}/> {e.fecha}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end px-12 border-x border-slate-50 min-w-[200px]">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 italic">Monto Salida</p>
                 <span className="text-rose-600 font-black text-2xl tabular-nums tracking-tighter">-${Number(e.monto).toLocaleString()}</span>
              </div>

              <div className="flex gap-2">
                 <button onClick={() => setEgresoSeleccionado(e)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><Printer size={20} /></button>
                 <button onClick={async () => { if(confirm("¿Eliminar?")) { await supabase.from("egresos").delete().eq("id", e.id); cargarEgresos(); }}} className="p-4 bg-slate-50 text-slate-300 hover:text-rose-600 rounded-2xl transition-all"><Trash2 size={20} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL REGISTRO EGRESO (ELEGANCIA MODERNA) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <form onSubmit={guardarEgreso} className="p-12">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <h3 className="text-slate-900 text-xl font-black uppercase tracking-tight">Ficha de Egreso</h3>
                <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><X /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Comprobante Nº</label>
                     <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-black outline-none focus:border-rose-500" value={form.recibo_n} onChange={(e)=>setForm({...form, recibo_n: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                     <input type="date" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold outline-none" value={form.fecha} onChange={(e)=>setForm({...form, fecha: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Beneficiario / Proveedor</label>
                  <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold outline-none focus:border-rose-500 uppercase text-xs" placeholder="Ej: Seguridad LTDA" onChange={(e)=>setForm({...form, pagado_a: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Concepto</label>
                  <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold outline-none focus:border-rose-500" placeholder="Ej: Servicio Vigilancia Enero" onChange={(e)=>setForm({...form, concepto: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor</label>
                    <input type="number" className="w-full bg-rose-50 p-4 rounded-xl font-black text-lg text-rose-600 outline-none" placeholder="0" onChange={(e)=>setForm({...form, monto: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Metodo</label>
                    <select className="w-full bg-slate-50 p-4 rounded-xl font-bold appearance-none outline-none" onChange={(e)=>setForm({...form, metodo: e.target.value})}>
                       <option>Transferencia</option><option>Efectivo</option>
                    </select>
                  </div>
                </div>

                <button 
                  disabled={procesando}
                  className="w-full mt-6 bg-slate-900 hover:bg-rose-600 text-white font-black py-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {procesando ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> PROCESAR GASTO</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPROBANTE (Ya corregido arriba) */}
      {egresoSeleccionado && (
        <ComprobanteEgreso 
          datos={{
            numero: egresoSeleccionado.recibo_n,
            fecha: egresoSeleccionado.fecha,
            concepto: egresoSeleccionado.concepto,
            pagado_a: egresoSeleccionado.pagado_a,
            valor: egresoSeleccionado.monto,
            metodo: egresoSeleccionado.metodo_pago
          }} 
          onClose={() => setEgresoSeleccionado(null)} 
        />
      )}
    </div>
  );
}