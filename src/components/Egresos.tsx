"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Search, Trash2, Printer, 
  TrendingDown, Loader2, X, CheckCircle2, 
  User, Receipt, Calendar, CreditCard, Banknote
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
  const [form, setForm] = useState<any>({
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

  async function sugerirSiguienteEgreso() {
    const { data } = await supabase.from("egresos").select("recibo_n").order("created_at", { ascending: false }).limit(1);
    if (data && data.length > 0) {
      const num = (parseInt(data[0].recibo_n?.replace(/\D/g, "") || "0") + 1).toString();
      setForm((f: any) => ({ ...f, recibo_n: num }));
    } else {
      setForm((f: any) => ({ ...f, recibo_n: "1" }));
    }
  }

  async function guardarEgreso(e: React.FormEvent) {
    e.preventDefault();
    if (!form.concepto || !form.monto || !form.pagado_a) return alert("Faltan datos");
    setProcesando(true);

    const { error } = await supabase.from("egresos").insert([{
      recibo_n: form.recibo_n,
      concepto: form.concepto.toUpperCase(),
      pagado_a: form.pagado_a.toUpperCase(),
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
    const term = busqueda.toLowerCase();
    const coincide = e.concepto.toLowerCase().includes(term) || e.pagado_a.toLowerCase().includes(term);
    const coincideMes = !filtroMes || e.fecha.startsWith(filtroMes);
    return coincide && coincideMes;
  });

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans">
      
      {/* 1. BARRA DE HERRAMIENTAS SUPERIOR */}
      <section className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
           <input 
            placeholder="Buscar concepto o beneficiario..."
            className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-4 rounded-xl outline-none focus:bg-white focus:border-rose-400 transition-all font-medium text-slate-700"
            onChange={(e) => setBusqueda(e.target.value)}
           />
        </div>
        
        <div className="flex gap-2">
          <input 
            type="month" 
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl outline-none font-bold text-slate-600 text-xs"
            onChange={(e) => setFiltroMes(e.target.value)}
          />
          <button 
            onClick={() => { setShowModal(true); sugerirSiguienteEgreso(); }}
            className="bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 whitespace-nowrap shadow-lg active:scale-95"
          >
            <Plus size={14} /> Registrar Gasto
          </button>
        </div>
      </section>

      {/* 2. SUMMARY / BALANCE (HORIZONTAL LIMPIO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-rose-500 border border-rose-100">
                <TrendingDown size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Total Gastado Periodo</p>
                 <h3 className="text-2xl font-black text-rose-700 tabular-nums">
                   ${egresosFiltrados.reduce((a, b) => a + Number(b.monto), 0).toLocaleString('es-CO')}
                 </h3>
              </div>
           </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-center text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros de caja: {egresosFiltrados.length}</p>
        </div>
      </div>

      {/* 3. HISTORIAL ORGANIZADO (LISTA ELEGANTE) */}
      <div className="space-y-2">
        {egresosFiltrados.map((e) => (
          <div key={e.id} className="bg-white border border-slate-200 p-4 md:px-6 md:py-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors">
            
            <div className="flex items-center gap-5 md:w-1/2 mb-4 md:mb-0">
               <div className="w-14 h-12 bg-slate-900 text-white rounded-lg flex flex-col items-center justify-center shadow-md">
                  <span className="text-[7px] font-black text-emerald-400 uppercase leading-none mb-1">Egreso</span>
                  <span className="text-sm font-black italic">#{e.recibo_n}</span>
               </div>
               <div className="truncate">
                  <h4 className="text-slate-900 font-bold text-sm uppercase truncate pr-4">{e.concepto}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">PAGO A: {e.pagado_a}</p>
               </div>
            </div>

            <div className="flex flex-row md:flex-col justify-between items-center md:items-end md:px-10 border-t md:border-t-0 md:border-x border-slate-100 pt-4 md:pt-0 mb-4 md:mb-0">
               <p className="text-[9px] font-black text-slate-300 uppercase md:mb-1 tracking-widest">Valor Pagado</p>
               <span className="text-rose-600 font-black text-xl tabular-nums tracking-tighter">-${Number(e.monto).toLocaleString()}</span>
            </div>

            <div className="flex gap-2">
               <button 
                onClick={() => setEgresoSeleccionado(e)} 
                className="flex-1 md:flex-none p-4 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 text-[10px] font-black"
               >
                 <Printer size={16} /> RECIBO
               </button>
               <button 
                onClick={async () => { if(confirm("¿Eliminar gasto?")) { await supabase.from("egresos").delete().eq("id", e.id); cargarEgresos(); }}} 
                className="p-4 text-slate-300 hover:text-rose-500 transition-all"
               >
                 <Trash2 size={16} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. MODAL DE REGISTRO (SENCILLO Y FUNCIONAL) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-2 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white">
             <form onSubmit={guardarEgreso} className="p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-5">
                   <h3 className="text-slate-900 text-lg font-bold uppercase tracking-tight flex items-center gap-3">
                     <div className="w-2 h-6 bg-rose-500 rounded-full"></div> Contabilidad Gasto
                   </h3>
                   <button type="button" onClick={()=>setShowModal(false)} className="text-slate-300"><X /></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[9px] font-black uppercase tracking-widest ml-1">Comprobante No.</label>
                    <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-black text-sm" value={form.recibo_n} onChange={(e)=>setForm({...form, recibo_n: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[9px] font-black uppercase tracking-widest ml-1">Fecha Pago</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold text-sm" value={form.fecha} onChange={(e)=>setForm({...form, fecha: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[9px] font-black uppercase tracking-widest ml-1">Pagar a (Tercero)</label>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold" placeholder="EJ: CODENSA ESP" onChange={(e)=>setForm({...form, pagado_a: e.target.value})} required />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[9px] font-black uppercase tracking-widest ml-1">Descripción del Egreso</label>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold" placeholder="EJ: FACTURA LUZ ZONAS COMUNES" onChange={(e)=>setForm({...form, concepto: e.target.value})} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[9px] font-black uppercase tracking-widest ml-1">Monto de Salida</label>
                    <input type="number" className="w-full bg-rose-50 border border-rose-200 p-4 rounded-xl outline-none font-black text-rose-600 text-lg tabular-nums" placeholder="0" onChange={(e)=>setForm({...form, monto: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[9px] font-black uppercase tracking-widest ml-1">Metodo</label>
                    <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold text-sm appearance-none" onChange={(e)=>setForm({...form, metodo: e.target.value})}>
                      <option>Transferencia</option>
                      <option>Efectivo</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                   <button type="submit" disabled={procesando} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] hover:bg-rose-600 transition-all">
                      {procesando ? <Loader2 className="animate-spin mx-auto"/> : "Confirmar Salida Caja"}
                   </button>
                   <button type="button" onClick={()=>setShowModal(false)} className="px-6 bg-slate-100 text-slate-500 font-bold py-4 rounded-xl uppercase text-[10px]">Cerrar</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* COMPROBANTE FINAL (POPUP DE IMPRESIÓN) */}
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