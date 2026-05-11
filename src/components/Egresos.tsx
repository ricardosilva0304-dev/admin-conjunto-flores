"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { fechaColStr } from "@/lib/utils";
import {
  Plus, Search, Trash2, Printer,
  TrendingDown, Loader2, X, Receipt,
  Calendar, Trash, ListPlus, Building2,
  ChevronDown, ChevronUp
} from "lucide-react";
import ComprobanteEgreso from "./ComprobanteEgreso";

const MESES: Record<string, string> = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
};

export default function Egresos({ role }: { role?: string }) {
  const [egresos, setEgresos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [egreSeleccionado, setEgreSeleccionado] = useState<any>(null);
  const [procesando, setProcesando] = useState(false);
  const [mesesAbiertos, setMesesAbiertos] = useState<Record<string, boolean>>({});

  const [items, setItems] = useState([{ concepto: "", valor: "" }]);
  const [form, setForm] = useState<any>({
    recibo_n: "", pagado_a: "",
    fecha: fechaColStr()
  });

  useEffect(() => {
    cargarEgresos();
    const canal = supabase.channel("egresos-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "egresos" }, cargarEgresos)
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  async function cargarEgresos() {
    setLoading(true);
    const { data } = await supabase.from("egresos").select("*").order('fecha', { ascending: false });
    if (data) data.sort((a: any, b: any) => Number(b.recibo_n || 0) - Number(a.recibo_n || 0));
    if (data) {
      setEgresos(data);
      // Abrir el mes más reciente por defecto
      if (data.length > 0) {
        const primerMes = data[0].fecha?.substring(0, 7);
        if (primerMes) setMesesAbiertos({ [primerMes]: true });
      }
    }
    setLoading(false);
  }

  async function sugerirSiguienteEgreso() {
    const { data, error } = await supabase.rpc("siguiente_numero_egreso");
    const siguiente = (!error && data) ? data as string : "1";
    setForm((f: any) => ({ ...f, recibo_n: siguiente }));
  }

  const agregarItem = () => setItems([...items, { concepto: "", valor: "" }]);
  const eliminarItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };
  const actualizarItem = (index: number, campo: string, valor: string) => {
    const n = [...items]; (n[index] as any)[campo] = valor; setItems(n);
  };

  const totalGasto = items.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

  async function guardarEgreso(e: React.FormEvent) {
    e.preventDefault();
    if (role === 'contador') return alert("No tienes permiso para registrar egresos.");
    if (!form.pagado_a || items.some(i => !i.concepto || !i.valor)) return alert("Completa todos los campos");
    setProcesando(true);
    const conceptoFinal = items.map(i => `${i.concepto.toUpperCase()}|$${Number(i.valor).toLocaleString('es-CO')}`).join("||");
    const nuevoEgresoObj = {
      recibo_n: form.recibo_n, concepto: conceptoFinal,
      pagado_a: form.pagado_a.toUpperCase(), monto: totalGasto,
      fecha: form.fecha, metodo_pago: 'Efectivo'
    };
    const { data, error } = await supabase.from("egresos").insert([nuevoEgresoObj]).select().single();
    if (!error && data) {
      setShowModal(false);
      setItems([{ concepto: "", valor: "" }]);
      await cargarEgresos();
      setEgreSeleccionado(data);
    } else { alert(error?.message || "Error al guardar"); }
    setProcesando(false);
  }

  // Filtrar
  const egresosFiltrados = egresos.filter(e => {
    const term = busqueda.toLowerCase();
    return (e.concepto.toLowerCase().includes(term) || e.pagado_a.toLowerCase().includes(term))
      && (!filtroMes || e.fecha.startsWith(filtroMes));
  });

  // Agrupar por mes
  const grupoPorMes = useMemo(() => {
    const grupos: Record<string, { egresos: any[]; total: number }> = {};
    egresosFiltrados.forEach(e => {
      const clave = e.fecha?.substring(0, 7) || "0000-00";
      if (!grupos[clave]) grupos[clave] = { egresos: [], total: 0 };
      grupos[clave].egresos.push(e);
      grupos[clave].total += Number(e.monto);
    });
    return grupos;
  }, [egresosFiltrados]);

  const totalGeneral = egresosFiltrados.reduce((a, b) => a + Number(b.monto), 0);

  const toggleMes = (clave: string) =>
    setMesesAbiertos(prev => ({ ...prev, [clave]: !prev[clave] }));

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={28} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5 pb-24 px-0 font-sans text-slate-800">

      {/* ── BARRA SUPERIOR ────────────────────────────────────── */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">

        {/* Búsqueda */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-400 transition-colors" size={16} />
          <input
            placeholder="Buscar beneficiario o concepto..."
            className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 sm:py-3.5 rounded-xl outline-none font-bold text-slate-700 text-sm focus:bg-white focus:ring-4 ring-rose-500/5 transition-all"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Filtro mes + botón */}
        <div className="flex gap-2">
          <input
            type="month"
            className="flex-1 min-w-0 bg-slate-50 border border-slate-100 p-3 sm:p-3.5 rounded-xl font-bold text-slate-600 text-sm outline-none focus:bg-white transition-all"
            onChange={(e) => setFiltroMes(e.target.value)}
          />
          <button
            onClick={() => { setShowModal(true); sugerirSiguienteEgreso(); }}
            className="flex-shrink-0 bg-slate-900 text-white px-4 sm:px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-rose-600 transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span className="hidden xs:inline sm:hidden md:inline">Registrar</span>
            <span className="hidden sm:inline md:hidden">Gasto</span>
            <span className="hidden md:inline">Registrar Gasto</span>
          </button>
        </div>
      </section>

      {/* ── LISTADO AGRUPADO POR MES ──────────────────────────── */}
      {Object.keys(grupoPorMes).length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Receipt className="mx-auto text-slate-300 mb-3" size={36} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            No hay gastos registrados
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(grupoPorMes).map(([clave, grupo]) => {
            const [anio, mesNum] = clave.split("-");
            const mesLabel = `${MESES[mesNum] || mesNum} ${anio}`;
            const abierto = mesesAbiertos[clave] ?? false;

            return (
              <div key={clave} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

                {/* Cabecera del mes — siempre visible, clickeable */}
                <button
                  onClick={() => toggleMes(clave)}
                  className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {/* Indicador color */}
                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-black text-slate-800 text-sm sm:text-base uppercase tracking-tight">
                        {mesLabel}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {grupo.egresos.length} {grupo.egresos.length === 1 ? 'egreso' : 'egresos'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Total del mes */}
                    <span className="font-black text-rose-600 tabular-nums text-sm sm:text-base">
                      -${grupo.total.toLocaleString('es-CO')}
                    </span>
                    {abierto
                      ? <ChevronUp size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                      : <ChevronDown size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                    }
                  </div>
                </button>

                {/* Filas de egresos — se ocultan/muestran */}
                {abierto && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {grupo.egresos.map((e) => {
                      const conceptoPrincipal = e.concepto.split("||")[0].split("|")[0];
                      const tieneVarios = e.concepto.includes("||");
                      return (
                        <div key={e.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 hover:bg-slate-50/70 transition-colors group/row">

                          {/* Badge CE */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center font-black shadow-sm group-hover/row:bg-rose-50 group-hover/row:border-rose-100 transition-colors flex-shrink-0">
                            <span className="text-[6px] sm:text-[7px] text-rose-500 uppercase tracking-widest leading-none">CE</span>
                            <span className="text-xs sm:text-sm text-slate-800 leading-tight">#{e.recibo_n}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Building2 size={9} className="text-slate-300 flex-shrink-0" />
                              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
                                {e.pagado_a}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase truncate leading-snug">
                              {conceptoPrincipal}
                              {tieneVarios && (
                                <span className="text-slate-300 italic normal-case text-[10px] ml-1 font-normal">+ varios</span>
                              )}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Calendar size={9} className="text-slate-300" />
                              <span className="text-[9px] font-bold text-slate-300">{e.fecha}</span>
                            </div>
                          </div>

                          {/* Monto */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-black text-rose-600 tabular-nums text-sm sm:text-base">
                              -${Number(e.monto).toLocaleString('es-CO')}
                            </p>
                          </div>

                          {/* Acciones */}
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => setEgreSeleccionado(e)}
                              className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Imprimir"
                            >
                              <Printer size={15} />
                            </button>
                            <button
                              onClick={async () => {
                                if (role === 'contador') return alert("No tienes permiso para eliminar egresos.");
                                if (confirm("¿Eliminar este egreso?")) {
                                  await supabase.from("egresos").delete().eq("id", e.id);
                                  cargarEgresos();
                                }
                              }}
                              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Subtotal del mes */}
                    <div className="flex justify-between items-center px-4 sm:px-6 py-3 bg-rose-50/60 border-t border-rose-100">
                      <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                        Subtotal {mesLabel}
                      </span>
                      <span className="font-black text-rose-600 tabular-nums text-sm">
                        -${grupo.total.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL REGISTRO ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 border border-white/20">

            <div className="p-5 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                <h3 className="text-slate-900 text-base sm:text-lg font-black uppercase italic tracking-tighter">
                  Contabilidad de Gasto
                </h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                <X size={22} />
              </button>
            </div>

            <div className="p-5 sm:p-8 overflow-y-auto max-h-[65vh] no-scrollbar space-y-5 sm:space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Egreso No.</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-2xl outline-none font-black text-slate-900 shadow-inner focus:bg-white text-sm"
                    value={form.recibo_n}
                    onChange={(e) => setForm({ ...form, recibo_n: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-2xl outline-none font-bold text-slate-600 shadow-inner focus:bg-white text-sm"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pagar a (Proveedor)</label>
                <input
                  className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-2xl outline-none font-black uppercase text-slate-900 shadow-inner focus:bg-white text-sm"
                  placeholder="EJ: EMPRESA DE VIGILANCIA"
                  value={form.pagado_a}
                  onChange={(e) => setForm({ ...form, pagado_a: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Receipt size={11} /> Desglose de Gastos
                </label>
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 sm:gap-3 animate-in slide-in-from-left-2">
                    <input
                      className="flex-1 min-w-0 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl outline-none font-bold text-sm uppercase focus:bg-white transition-all shadow-inner"
                      placeholder="Descripción del concepto"
                      value={item.concepto}
                      onChange={(e) => actualizarItem(index, 'concepto', e.target.value)}
                    />
                    <div className="relative w-32 sm:w-40 flex-shrink-0">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">$</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        className="w-full bg-slate-50 border border-slate-100 p-3.5 pl-8 rounded-2xl outline-none font-black text-slate-900 shadow-inner focus:bg-white transition-all text-sm"
                        placeholder="0"
                        value={item.valor}
                        onChange={(e) => actualizarItem(index, 'valor', e.target.value)}
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        onClick={() => eliminarItem(index)}
                        type="button"
                        className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 flex-shrink-0"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={agregarItem}
                  className="w-full py-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-rose-300 hover:text-rose-600 transition-all flex items-center justify-center gap-2"
                >
                  <ListPlus size={15} /> Añadir línea
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Egreso</p>
                <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                  ${totalGasto.toLocaleString('es-CO')}
                </h4>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={guardarEgreso}
                  disabled={procesando || totalGasto === 0}
                  className="flex-1 sm:flex-none bg-slate-900 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {procesando ? <Loader2 className="animate-spin" size={16} /> : "PROCESAR"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 sm:px-8 py-4 sm:py-5 bg-white border border-slate-200 text-slate-400 font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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