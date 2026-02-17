"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Search, Trash2, Printer,
  TrendingDown, Loader2, X, Receipt,
  Calendar, CreditCard, Banknote, Trash,
  ChevronRight, ListPlus
} from "lucide-react";
import ComprobanteEgreso from "./ComprobanteEgreso";

export default function Egresos() {
  const [egresos, setEgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [egreSeleccionado, setEgreSeleccionado] = useState<any>(null);
  const [procesando, setProcesando] = useState(false);

  // --- NUEVA LÓGICA DE CONCEPTOS MÚLTIPLES ---
  const [items, setItems] = useState([{ concepto: "", valor: "" }]);
  const [form, setForm] = useState<any>({
    recibo_n: "", pagado_a: "", 
    fecha: new Date().toISOString().split('T')[0] // Eliminamos `metodo` de aquí
  });

  useEffect(() => { cargarEgresos(); }, []);

  async function cargarEgresos() {
    setLoading(true);
    const { data } = await supabase.from("egresos").select("*").order('created_at', { ascending: false });
    if (data) setEgresos(data);
    setLoading(false);
  }

  async function sugerirSiguienteEgreso() {
    const { data } = await supabase.from("egresos").select("recibo_n").order("created_at", { ascending: false }).limit(5);
    if (data && data.length > 0) {
      const numeros = data.map(e => parseInt(e.recibo_n?.replace(/\D/g, "")) || 0);
      setForm((f: any) => ({ ...f, recibo_n: (Math.max(...numeros) + 1).toString() }));
    } else {
      setForm((f: any) => ({ ...f, recibo_n: "1" }));
    }
  }

  // Funciones para manejar los items dinámicos
  const agregarItem = () => setItems([...items, { concepto: "", valor: "" }]);
  const eliminarItem = (index: number) => {
    if (items.length > 1) {
      const nuevosItems = items.filter((_, i) => i !== index);
      setItems(nuevosItems);
    }
  };
  const actualizarItem = (index: number, campo: string, valor: string) => {
    const nuevosItems = [...items];
    (nuevosItems[index] as any)[campo] = valor;
    setItems(nuevosItems);
  };

  const totalGasto = items.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

  async function guardarEgreso(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pagado_a || items.some(i => !i.concepto || !i.valor)) return alert("Completa todos los campos");

    setProcesando(true);
    const conceptoFinal = items.map(i => `${i.concepto.toUpperCase()}|$${Number(i.valor).toLocaleString('es-CO')}`).join("||");

    const { error } = await supabase.from("egresos").insert([{
      recibo_n: form.recibo_n,
      concepto: conceptoFinal,
      pagado_a: form.pagado_a.toUpperCase(),
      monto: totalGasto,
      fecha: form.fecha,
      metodo_pago: 'Efectivo' // <-- ¡CORRECCIÓN APLICADA! Ahora siempre será 'Efectivo'.
    }]);

    if (!error) {
      setShowModal(false);
      setItems([{ concepto: "", valor: "" }]);
      cargarEgresos();
    } else { alert(error.message); }
    setProcesando(false);
  }

  const egresosFiltrados = egresos.filter(e => {
    const term = busqueda.toLowerCase();
    return (e.concepto.toLowerCase().includes(term) || e.pagado_a.toLowerCase().includes(term)) && (!filtroMes || e.fecha.startsWith(filtroMes));
  });

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans text-slate-800">

      {/* HEADER & FILTROS */}
      <section className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input placeholder="Buscar gasto..." className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white transition-all" onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <input type="month" className="bg-slate-50 border border-slate-100 px-6 rounded-2xl font-bold text-slate-500 outline-none" onChange={(e) => setFiltroMes(e.target.value)} />
        <button onClick={() => { setShowModal(true); sugerirSiguienteEgreso(); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95">
          REGISTRAR GASTO
        </button>
      </section>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Gastado Periodo</p>
            <h3 className="text-3xl font-black text-rose-700 tabular-nums">${egresosFiltrados.reduce((a, b) => a + Number(b.monto), 0).toLocaleString()}</h3>
          </div>
          <TrendingDown size={40} className="text-rose-200" />
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[2rem] flex items-center justify-center text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Registros en archivo: {egresosFiltrados.length}</p>
        </div>
      </div>

      {/* LISTADO */}
      <div className="space-y-2">
        {egresosFiltrados.map((e) => (
          <div key={e.id} className="bg-white border border-slate-100 p-5 rounded-[1.8rem] flex flex-col md:flex-row md:items-center justify-between hover:border-emerald-200 transition-all group shadow-sm">
            <div className="flex items-center gap-6 md:w-1/2">
              <div className="w-14 h-12 bg-slate-900 text-white rounded-xl flex flex-col items-center justify-center font-black italic shadow-md">
                <span className="text-[7px] text-emerald-400 uppercase leading-none">CE</span>
                <span className="text-sm">#{e.recibo_n}</span>
              </div>
              <div className="truncate">
                <h4 className="text-slate-800 font-black text-sm uppercase truncate">{e.concepto.split("||")[0].split("|")[0]}...</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">BENEFICIARIO: {e.pagado_a}</p>
              </div>
            </div>
            <div className="flex items-center gap-10 mt-4 md:mt-0">
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Valor Total</p>
                <span className="text-rose-600 font-black text-xl tabular-nums">-${Number(e.monto).toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEgreSeleccionado(e)} className="p-3.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Printer size={18} /></button>
                <button onClick={async () => { if (confirm("¿Borrar?")) { await supabase.from("egresos").delete().eq("id", e.id); cargarEgresos(); } }} className="p-3.5 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE REGISTRO DINÁMICO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 border border-white/20">

            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                <h3 className="text-slate-900 text-lg font-black uppercase italic tracking-tighter">Contabilidad de Gasto</h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[70vh] no-scrollbar">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Egreso No.</label>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-black text-slate-900 shadow-inner" value={form.recibo_n} onChange={(e) => setForm({ ...form, recibo_n: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-600 shadow-inner" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5 mb-8">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Pagar a (Tercero / Proveedor)</label>
                <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-black uppercase text-slate-900 shadow-inner" placeholder="EJ: EMPRESA DE VIGILANCIA" value={form.pagado_a} onChange={(e) => setForm({ ...form, pagado_a: e.target.value })} required />
              </div>

              {/* SECCIÓN DINÁMICA DE ITEMS */}
              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Receipt size={12} /> Desglose de Gastos
                </label>

                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 animate-in slide-in-from-left-2">
                    <input
                      className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm uppercase focus:bg-white transition-all shadow-inner"
                      placeholder="Descripción del concepto"
                      value={item.concepto}
                      onChange={(e) => actualizarItem(index, 'concepto', e.target.value)}
                    />
                    <div className="relative w-40">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-100 p-4 pl-8 rounded-2xl outline-none font-black text-slate-900 shadow-inner focus:bg-white transition-all"
                        placeholder="0"
                        value={item.valor}
                        onChange={(e) => actualizarItem(index, 'valor', e.target.value)}
                      />
                    </div>
                    {items.length > 1 && (
                      <button onClick={() => eliminarItem(index)} className="p-4 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={agregarItem}
                  className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <ListPlus size={16} /> Añadir nuevo concepto
                </button>
              </div>
            </div>

            {/* FOOTER DEL MODAL */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Valor Total Egreso</p>
                <h4 className="text-3xl font-black text-slate-900 tabular-nums">${totalGasto.toLocaleString()}</h4>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={guardarEgreso} disabled={procesando || totalGasto === 0} className="flex-1 md:flex-none bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-30">
                  {procesando ? <Loader2 className="animate-spin mx-auto" /> : "CONFIRMAR SALIDA"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-5 bg-white border border-slate-200 text-slate-400 font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50">CERRAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPROBANTE FINAL (POPUP DE IMPRESIÓN) */}
      {egreSeleccionado && (
        <ComprobanteEgreso
          datos={{
            numero: egreSeleccionado.recibo_n,
            fecha: egreSeleccionado.fecha,
            concepto: egreSeleccionado.concepto,
            pagado_a: egreSeleccionado.pagado_a,
            valor: egreSeleccionado.monto,
            metodo: egreSeleccionado.metodo_pago
          }}
          onClose={() => setEgreSeleccionado(null)}
        />
      )}

    </div>
  );
}