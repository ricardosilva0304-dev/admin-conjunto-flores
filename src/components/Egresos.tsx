"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Search, Trash2, Printer,
  TrendingDown, Loader2, X, Receipt,
  Calendar, Trash, ListPlus, Building2
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

  const [items, setItems] = useState([{ concepto: "", valor: "" }]);
  const [form, setForm] = useState<any>({
    recibo_n: "", pagado_a: "",
    fecha: new Date().toISOString().split('T')[0]
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

    const nuevoEgresoObj = {
      recibo_n: form.recibo_n,
      concepto: conceptoFinal,
      pagado_a: form.pagado_a.toUpperCase(),
      monto: totalGasto,
      fecha: form.fecha,
      metodo_pago: 'Efectivo'
    };

    const { data, error } = await supabase.from("egresos").insert([nuevoEgresoObj]).select().single();

    if (!error && data) {
      setShowModal(false);
      setItems([{ concepto: "", valor: "" }]);

      // 1. Recargamos la lista en el fondo
      await cargarEgresos();

      // 2. ¡NUEVO! Abrimos el comprobante automáticamente usando los datos que acabamos de guardar
      setEgreSeleccionado(data);

    } else {
      alert(error?.message || "Error al guardar");
    }
    setProcesando(false);
  }

  const egresosFiltrados = egresos.filter(e => {
    const term = busqueda.toLowerCase();
    return (e.concepto.toLowerCase().includes(term) || e.pagado_a.toLowerCase().includes(term)) && (!filtroMes || e.fecha.startsWith(filtroMes));
  });

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-2 md:px-0 font-sans text-slate-800">

      {/* HEADER & FILTROS (DISEÑO LIMPIO) */}
      <section className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            placeholder="Buscar por beneficiario o concepto..."
            className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl outline-none font-bold text-slate-700 text-sm focus:bg-white focus:ring-4 ring-emerald-500/5 transition-all"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="month"
            className="w-full md:w-48 bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-600 outline-none focus:bg-white transition-all"
            onChange={(e) => setFiltroMes(e.target.value)}
          />
          <button
            onClick={() => { setShowModal(true); sugerirSiguienteEgreso(); }}
            className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> REGISTRAR GASTO
          </button>
        </div>
      </section>

      {/* KPIS (DISEÑO TIPO DASHBOARD PREMIUM) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOTAL GASTADO (Doble ancho) */}
        <div className="lg:col-span-2 bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 text-rose-600">
            <TrendingDown size={180} strokeWidth={3} className="-mr-10" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-2">Total Egresos Periodo</p>
            <h3 className="text-5xl font-black text-rose-600 tabular-nums tracking-tighter">
              ${egresosFiltrados.reduce((a, b) => a + Number(b.monto), 0).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* CONTADOR DE REGISTROS */}
        <div className="bg-white border border-slate-200 p-8 rounded-[2rem] flex flex-col justify-center shadow-sm">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4 border border-slate-100">
            <Receipt size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volumen Operativo</p>
          <h3 className="text-3xl font-black text-slate-800">{egresosFiltrados.length} <span className="text-xs text-slate-400 uppercase tracking-widest">Facturas</span></h3>
        </div>
      </div>

      {/* LISTADO DE EGRESOS (REDISEÑO TIPO TICKET) */}
      <div className="space-y-4">
        {egresosFiltrados.map((e) => (
          <div key={e.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">

            {/* Detalle visual lateral (opcional, le da toque premium) */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-slate-100 group-hover:bg-emerald-400 transition-colors"></div>

            <div className="flex items-center gap-6 md:w-3/5 pl-4">
              {/* Badge de CE rediseñado */}
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center font-black shadow-sm group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors shrink-0">
                <span className="text-[8px] text-emerald-600 uppercase tracking-widest leading-none mb-1">CE</span>
                <span className="text-lg text-slate-800">#{e.recibo_n}</span>
              </div>

              <div className="min-w-0 pr-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Building2 size={10} /> {e.pagado_a}
                </p>
                <h4 className="text-slate-800 font-bold text-sm uppercase truncate mb-1.5">
                  {e.concepto.split("||")[0].split("|")[0]} {e.concepto.includes("||") && <span className="text-slate-300 italic normal-case text-xs ml-1">(+ varios)</span>}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Calendar size={10} /> {e.fecha}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8 mt-6 md:mt-0 pl-4 md:pl-0 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Monto Pagado</p>
                <span className="text-rose-600 font-black text-2xl tabular-nums tracking-tight">-${Number(e.monto).toLocaleString()}</span>
              </div>

              <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button onClick={() => setEgreSeleccionado(e)} className="p-3 bg-white text-slate-400 rounded-xl hover:bg-emerald-500 hover:text-white hover:shadow-md transition-all" title="IMPRIMIR">
                  <Printer size={18} />
                </button>
                <button onClick={async () => { if (confirm("¿Eliminar definitivamente este egreso? Esta acción modificará los saldos de caja.")) { await supabase.from("egresos").delete().eq("id", e.id); cargarEgresos(); } }} className="p-3 bg-white text-slate-300 rounded-xl hover:bg-rose-500 hover:text-white hover:shadow-md transition-all" title="Eliminar">
                  <Trash size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {egresosFiltrados.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
            <Receipt className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No hay gastos registrados en este periodo</p>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO DINÁMICO (Se mantiene igual, la lógica ya la corregimos) */}
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
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-black text-slate-900 shadow-inner focus:bg-white" value={form.recibo_n} onChange={(e) => setForm({ ...form, recibo_n: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-600 shadow-inner focus:bg-white" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5 mb-8">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Pagar a (Tercero / Proveedor)</label>
                <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-black uppercase text-slate-900 shadow-inner focus:bg-white" placeholder="EJ: EMPRESA DE VIGILANCIA" value={form.pagado_a} onChange={(e) => setForm({ ...form, pagado_a: e.target.value })} required />
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
                      <button onClick={() => eliminarItem(index)} type="button" className="p-4 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={agregarItem}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <ListPlus size={16} /> Añadir nueva línea de detalle
                </button>
              </div>
            </div>

            {/* FOOTER DEL MODAL */}
            <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Valor Total Egreso</p>
                <h4 className="text-3xl font-black text-slate-900 tabular-nums">${totalGasto.toLocaleString()}</h4>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={guardarEgreso} disabled={procesando || totalGasto === 0} className="flex-1 md:flex-none bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2">
                  {procesando ? <Loader2 className="animate-spin" size={16} /> : "PROCESAR Y GENERAR PDF"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-5 bg-white border border-slate-200 text-slate-400 font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">CERRAR</button>
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