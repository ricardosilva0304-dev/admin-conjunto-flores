"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Search, Calendar, Trash2, Printer, 
  TrendingDown, Loader2, X, CheckCircle2, 
  ArrowRight, Landmark, Banknote, User, Receipt
} from "lucide-react";
import ComprobanteEgreso from "./ComprobanteEgreso"; // Crearemos este abajo

export default function Egresos() {
  const [egresos, setEgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [egresoSeleccionado, setEgresoSeleccionado] = useState<any>(null);

  // Estado del Formulario
  const [form, setForm] = useState({
    recibo_n: "", concepto: "", pagado_a: "", monto: "", fecha: new Date().toISOString().split('T')[0], metodo: "Transferencia"
  });

  useEffect(() => { cargarEgresos(); }, []);

  async function cargarEgresos() {
    setLoading(true);
    const { data } = await supabase.from("egresos").select("*").order('fecha', { ascending: false });
    if (data) setEgresos(data);
    setLoading(false);
  }

  async function guardarEgreso(e: React.FormEvent) {
    e.preventDefault();
    if (!form.concepto || !form.monto || !form.pagado_a) return alert("Llena los campos obligatorios");

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
      setForm({ recibo_n: "", concepto: "", pagado_a: "", monto: "", fecha: new Date().toISOString().split('T')[0], metodo: "Transferencia" });
      cargarEgresos();
    } else {
      alert("Error: " + error.message);
    }
  }

  const egresosFiltrados = egresos.filter(e => {
    const cumpleBusqueda = e.concepto.toLowerCase().includes(busqueda.toLowerCase()) || e.pagado_a.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleMes = !filtroMes || e.fecha.startsWith(filtroMes);
    return cumpleBusqueda && cumpleMes;
  });

  const totalGastado = egresosFiltrados.reduce((acc, e) => acc + Number(e.monto), 0);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 1. PANEL SUPERIOR DE FILTROS Y ACCIONES */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
              <TrendingDown size={28} />
            </div>
            <div>
              <h2 className="text-slate-900 text-3xl font-black uppercase tracking-tighter leading-none mb-1">Egresos</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Control de Gastos y Pagos</p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-3 w-full">
            <div className="relative flex-1 max-w-xs group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={18} />
              <input 
                placeholder="Buscar concepto o proveedor..."
                className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-4 rounded-2xl outline-none focus:ring-4 ring-rose-500/5 focus:border-rose-500 font-bold text-slate-700 transition-all"
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <input 
              type="month" 
              className="bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700"
              onChange={(e) => setFiltroMes(e.target.value)}
            />
            <button 
              onClick={() => setShowModal(true)}
              className="bg-slate-900 hover:bg-black text-white font-black px-8 py-4 rounded-2xl shadow-xl transition-all flex items-center gap-3 active:scale-95"
            >
              <Plus size={20} /> NUEVO EGRESO
            </button>
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="px-6 py-2 bg-rose-50 border border-rose-100 rounded-full">
                 <span className="text-rose-600 font-black text-xs uppercase tracking-widest">Gasto en Periodo: </span>
                 <span className="text-rose-700 font-black text-lg ml-2 tabular-nums">${totalGastado.toLocaleString()}</span>
              </div>
           </div>
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{egresosFiltrados.length} Registros encontrados</p>
        </div>
      </section>

      {/* 2. HISTORIAL DE EGRESOS */}
      <div className="space-y-3">
        {egresosFiltrados.map((e) => (
          <div key={e.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center justify-between hover:shadow-xl hover:shadow-rose-500/5 transition-all group relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex items-center gap-6 w-1/2">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all font-black text-[10px]">
                <span className="opacity-50">CE</span>
                <span>{e.recibo_n || e.id}</span>
              </div>
              <div className="truncate">
                <h4 className="text-slate-900 font-black text-base truncate uppercase">{e.concepto}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1.5">
                    <User size={12} className="text-rose-400"/> {e.pagado_a}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1.5">
                    <Calendar size={12}/> {e.fecha}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-10 px-10 border-x border-slate-50">
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-widest">Valor Pagado</p>
                  <span className="text-rose-600 font-black text-xl tabular-nums">${Number(e.monto).toLocaleString()}</span>
               </div>
               <div className="text-right hidden md:block">
                  <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-widest">Fondo</p>
                  <span className="text-slate-900 font-bold text-[10px] bg-slate-100 px-3 py-1 rounded-full uppercase">{e.metodo_pago}</span>
               </div>
            </div>

            <div className="flex gap-2">
               <button onClick={() => setEgresoSeleccionado(e)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm">
                  <Printer size={20} />
               </button>
               <button onClick={async () => { if(confirm("¿Eliminar egreso?")) { await supabase.from("egresos").delete().eq("id", e.id); cargarEgresos(); }}} className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all">
                  <Trash2 size={20} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MODAL NUEVO EGRESO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <form onSubmit={guardarEgreso} className="p-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white"><Receipt /></div>
                  <h3 className="text-slate-900 text-2xl font-black uppercase tracking-tighter">Registrar Egreso</h3>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={32}/></button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº Comprobante</label>
                     <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="CE-100" onChange={(e)=>setForm({...form, recibo_n: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                     <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" value={form.fecha} onChange={(e)=>setForm({...form, fecha: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Concepto del Gasto</label>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:border-rose-500 font-bold" placeholder="Ej: Pago servicio de Vigilancia" onChange={(e)=>setForm({...form, concepto: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pagado a (Proveedor/Empleado)</label>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:border-rose-500 font-bold" placeholder="Nombre completo o Empresa" onChange={(e)=>setForm({...form, pagado_a: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Total</label>
                    <input type="number" className="w-full bg-rose-50 border border-rose-100 p-4 rounded-2xl outline-none text-rose-600 font-black text-lg" placeholder="0" onChange={(e)=>setForm({...form, monto: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medio de Pago</label>
                    <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold appearance-none" onChange={(e)=>setForm({...form, metodo: e.target.value})}>
                       <option>Transferencia</option>
                       <option>Efectivo</option>
                       <option>Cheque</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <button type="submit" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black py-6 rounded-2xl shadow-xl shadow-rose-100 transition-all flex items-center justify-center gap-3">
                  <CheckCircle2 size={24} /> GUARDAR EGRESO
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-10 bg-slate-100 text-slate-500 font-bold py-6 rounded-2xl">SALIR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. COMPROBANTE DE EGRESO (REUTILIZANDO LÓGICA DE RECIBO) */}
      {egresoSeleccionado && (
        <ComprobanteEgreso 
          datos={{
            numero: egresoSeleccionado.recibo_n || egresoSeleccionado.id.toString(),
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