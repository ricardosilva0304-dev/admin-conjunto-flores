"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  Zap, History, Trash2, Eye, X, Loader2,
  CheckCircle2, Calendar, Search, ChevronDown, ChevronUp, Printer,
  Car, Bike, Users, TrendingUp, UserCheck, Pencil
} from "lucide-react";

// ── IMPRESIÓN ─────────────────────────────────────────────────────────────────
function imprimirCausacion(causacionActiva: any, deudasDetalle: any[], calcFn: (d: any) => number) {
  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase();
  const torreIndex = (unidad: string) => {
    const letra = unidad?.charAt(1);
    const orden: Record<string, number> = { "5": 0, "6": 1, "7": 2, "8": 3 };
    return orden[letra] ?? 99;
  };
  const sinPagar = [...deudasDetalle]
    .filter(d => Number(d.saldo_pendiente) > 0)
    .sort((a, b) => {
      const ti = torreIndex(a.unidad) - torreIndex(b.unidad);
      return ti !== 0 ? ti : (a.unidad || "").localeCompare(b.unidad || "");
    });
  const abonados = sinPagar.filter(d => Number(d.monto_original) > Number(d.saldo_pendiente));
  const pendientes = sinPagar.filter(d => Number(d.monto_original) <= Number(d.saldo_pendiente));
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;
  const totalPorCobrar = sinPagar.reduce((acc, d) => acc + calcFn(d), 0);
  const totalPagado = deudasDetalle.reduce((acc, d) => acc + (Number(d.monto_original) - Number(d.saldo_pendiente)), 0);
  const totalUnidades = deudasDetalle.length;
  const totalPagadas = deudasDetalle.filter(d => Number(d.saldo_pendiente) === 0).length;
  const filas = (lista: any[]) => lista.map(d => {
    const abonado = Number(d.monto_original) - Number(d.saldo_pendiente);
    const saldo = calcFn(d);
    const tieneAbono = abonado > 0;
    return `<tr>
      <td class="uni">${d.unidad}</td>
      <td>${d.residentes?.nombre || "—"}</td>
      ${tieneAbono ? `<td class="num muted">Abonó: ${fmt(abonado)}</td>` : `<td></td>`}
      <td class="num debe">${fmt(saldo)}</td>
    </tr>`;
  }).join("");
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
  <title>${causacionActiva?.concepto_nombre} — Saldos Pendientes</title>
  <style>
    @page { margin: 16mm 14mm; size: letter; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", Arial, sans-serif; font-size: 9pt; color: #1a1a2e; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 10px; border-bottom: 2px solid #1a1a2e; margin-bottom: 14px; }
    .header h1 { font-size: 18pt; font-weight: 900; letter-spacing: -0.5px; line-height: 1; }
    .header .sub { font-size: 7.5pt; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    .header .right { text-align: right; }
    .header .concepto { font-size: 10pt; font-weight: 800; text-transform: uppercase; }
    .header .fecha { font-size: 7pt; color: #9ca3af; margin-top: 3px; }
    .resumen { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
    .kpi { padding: 8px 10px; border-radius: 6px; border: 1px solid; }
    .kpi.azul  { background: #eff6ff; border-color: #bfdbfe; }
    .kpi.verde { background: #f0fdf4; border-color: #bbf7d0; }
    .kpi.rojo  { background: #fff1f2; border-color: #fecdd3; }
    .kpi.gris  { background: #f9fafb; border-color: #e5e7eb; }
    .kpi .lbl  { font-size: 6.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7280; }
    .kpi .val  { font-size: 13pt; font-weight: 900; margin-top: 2px; }
    .kpi.azul  .val { color: #1d4ed8; }
    .kpi.verde .val { color: #15803d; }
    .kpi.rojo  .val { color: #be123c; }
    .kpi.gris  .val { color: #374151; }
    .sec-title { font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 4px 10px; border-radius: 4px; display: inline-block; margin: 12px 0 6px; }
    .sec-title.abono    { background: #fff7ed; color: #c2410c; }
    .sec-title.pendiente { background: #fef2f2; color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { border-bottom: 1.5px solid #e5e7eb; }
    th { font-size: 6.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; padding: 4px 6px; text-align: left; }
    th.num { text-align: right; }
    td { font-size: 8.5pt; padding: 5px 6px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    td.uni { font-weight: 900; font-size: 8pt; background: #1a1a2e; color: #fff; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
    td.num { text-align: right; }
    td.debe { font-weight: 900; color: #dc2626; }
    td.muted { color: #9ca3af; font-size: 7.5pt; }
    .nota { font-size: 7pt; color: #9ca3af; margin-bottom: 14px; font-style: italic; }
    .footer { margin-top: 18px; border-top: 1px solid #e5e7eb; padding-top: 8px; display: flex; justify-content: space-between; }
    .footer p { font-size: 6.5pt; font-weight: 700; color: #d1d5db; text-transform: uppercase; letter-spacing: 2px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style></head><body>
  <div class="header">
    <div><h1>Saldos Pendientes</h1><div class="sub">Parque de las Flores · Administración</div></div>
    <div class="right"><div class="concepto">${causacionActiva?.concepto_nombre}</div><div class="fecha">Impreso: ${fechaStr}</div></div>
  </div>
  <div class="resumen">
    <div class="kpi azul"><div class="lbl">Total unidades</div><div class="val">${totalUnidades}</div></div>
    <div class="kpi verde"><div class="lbl">Ya pagaron</div><div class="val">${totalPagadas}</div></div>
    <div class="kpi rojo"><div class="lbl">Sin pagar</div><div class="val">${sinPagar.length}</div></div>
    <div class="kpi gris"><div class="lbl">Por cobrar</div><div class="val" style="font-size:10pt">${fmt(totalPorCobrar)}</div></div>
  </div>
  <p class="nota">Este documento muestra únicamente unidades con saldo pendiente. Las ${totalPagadas} unidades que ya cancelaron no aparecen.</p>
  ${abonados.length > 0 ? `<div class="sec-title abono">Con abono — saldo parcial (${abonados.length})</div><table><thead><tr><th>Unidad</th><th>Residente</th><th class="num">Abonado</th><th class="num">Saldo debe</th></tr></thead><tbody>${filas(abonados)}</tbody></table>` : ""}
  ${pendientes.length > 0 ? `<div class="sec-title pendiente">Sin ningún pago (${pendientes.length})</div><table><thead><tr><th>Unidad</th><th>Residente</th><th></th><th class="num">Valor debe</th></tr></thead><tbody>${filas(pendientes)}</tbody></table>` : ""}
  <div class="footer"><p>Admin · Parque de las Flores</p><p>Recaudado: ${fmt(totalPagado)} / Por cobrar: ${fmt(totalPorCobrar)}</p></div>
  </body></html>`;
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

export default function Causacion({ role }: { role?: string }) {
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [residentes, setResidentes] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [showDetalles, setShowDetalles] = useState(false);
  const [causacionActiva, setCausacionActiva] = useState<any>(null);
  const [deudasDetalle, setDeudasDetalle] = useState<any[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [busquedaDetalle, setBusquedaDetalle] = useState("");
  const [filtroModal, setFiltroModal] = useState<"TODOS" | "PENDIENTE" | "ABONO" | "PAGADO">("TODOS");
  const [conceptoId, setConceptoId] = useState("");
  const [mesDeuda, setMesDeuda] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [mesesAbiertos, setMesesAbiertos] = useState<Record<string, boolean>>({});

  // ── NUEVO: modo selección de residentes ──
  const [modoSeleccion, setModoSeleccion] = useState(false);   // false = todos, true = elegir
  const [residentesSeleccionados, setResidentesSeleccionados] = useState<Set<number>>(new Set());
  const [busquedaResidente, setBusquedaResidente] = useState("");

  // ── NUEVO: modo edición individual ──
  const [editandoDeuda, setEditandoDeuda] = useState<any | null>(null);
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  useEffect(() => {
    cargarDatos();
    const canal = supabase.channel("causacion-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "causaciones_globales" }, cargarDatos)
      .on("postgres_changes", { event: "*", schema: "public", table: "deudas_residentes" }, cargarDatos)
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  async function cargarDatos() {
    setLoading(true);
    const [c, r, h] = await Promise.all([
      supabase.from("conceptos_pago").select("*"),
      supabase.from("residentes").select("*").neq("torre", "Torre 1"),
      supabase.from("causaciones_globales").select("*").order("mes_causado", { ascending: false })
    ]);
    if (c.data) setConceptos(c.data);
    if (r.data) setResidentes(r.data);
    if (h.data) {
      setHistorial(h.data);
      if (h.data.length > 0) setMesesAbiertos({ [h.data[0].mes_causado]: true });
    }
    setLoading(false);
  }

  const historialAgrupado = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    historial.forEach(h => {
      if (!grupos[h.mes_causado]) grupos[h.mes_causado] = [];
      grupos[h.mes_causado].push(h);
    });
    return grupos;
  }, [historial]);

  const mesesOrdenados = Object.keys(historialAgrupado).sort().reverse();

  // Residentes filtrados por vehículo
  const residentesPorTipo = useMemo(() => residentes.filter(r => {
    if (filtroTipo === "TODOS") return true;
    if (filtroTipo === "CARRO") return (r.carros || 0) > 0;
    if (filtroTipo === "MOTO") return (r.motos || 0) > 0;
    if (filtroTipo === "BICI") return (r.bicis || 0) > 0;
    return false;
  }), [residentes, filtroTipo]);

  // Residentes que finalmente se van a causar
  const residentesAfectados = useMemo(() => {
    if (!modoSeleccion) return residentesPorTipo;
    return residentesPorTipo.filter(r => residentesSeleccionados.has(r.id));
  }, [residentesPorTipo, modoSeleccion, residentesSeleccionados]);

  // Residentes visibles en el selector (con búsqueda)
  const residentesFiltradosSelector = useMemo(() => {
    const q = busquedaResidente.toLowerCase();
    return residentesPorTipo.filter(r =>
      !q || r.nombre?.toLowerCase().includes(q) || r.apartamento?.toLowerCase().includes(q) || r.torre?.toLowerCase().includes(q)
    );
  }, [residentesPorTipo, busquedaResidente]);

  function toggleResidente(id: number) {
    setResidentesSeleccionados(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function seleccionarTodos() {
    setResidentesSeleccionados(new Set(residentesPorTipo.map(r => r.id)));
  }

  function limpiarSeleccion() {
    setResidentesSeleccionados(new Set());
  }

  const deudasFiltradas = useMemo(() => {
    let lista = deudasDetalle.filter(d =>
      d.unidad?.toLowerCase().includes(busquedaDetalle.toLowerCase()) ||
      d.residentes?.nombre?.toLowerCase().includes(busquedaDetalle.toLowerCase())
    );
    if (filtroModal === "PENDIENTE") lista = lista.filter(d => Number(d.saldo_pendiente) > 0 && Number(d.monto_original) <= Number(d.saldo_pendiente));
    if (filtroModal === "ABONO") lista = lista.filter(d => Number(d.saldo_pendiente) > 0 && Number(d.monto_original) > Number(d.saldo_pendiente));
    if (filtroModal === "PAGADO") lista = lista.filter(d => Number(d.saldo_pendiente) === 0);
    return lista;
  }, [deudasDetalle, busquedaDetalle, filtroModal]);

  const cntPagado = useMemo(() => deudasDetalle.filter(d => Number(d.saldo_pendiente) === 0).length, [deudasDetalle]);
  const cntAbono = useMemo(() => deudasDetalle.filter(d => Number(d.saldo_pendiente) > 0 && Number(d.monto_original) > Number(d.saldo_pendiente)).length, [deudasDetalle]);
  const cntPendiente = useMemo(() => deudasDetalle.filter(d => Number(d.saldo_pendiente) > 0 && Number(d.monto_original) <= Number(d.saldo_pendiente)).length, [deudasDetalle]);

  async function cambiarModo(id: number, nuevoModo: string) {
    if (role === "contador") return alert("No tienes permiso para modificar causaciones.");
    setHistorial(prev => prev.map(h => h.id === id ? { ...h, tipo_cobro: nuevoModo } : h));
    await supabase.from("causaciones_globales").update({ tipo_cobro: nuevoModo }).eq("id", id);
  }

  async function verDetalles(causacion: any) {
    setCausacionActiva(causacion);
    setShowDetalles(true);
    setLoadingDetalle(true);
    setBusquedaDetalle("");
    setFiltroModal("TODOS");
    const { data } = await supabase
      .from("deudas_residentes")
      .select("*, residentes(nombre), causaciones_globales(mes_causado, tipo_cobro)")
      .eq("causacion_id", causacion.id)
      .order("unidad", { ascending: true });
    if (data) setDeudasDetalle(data);
    setLoadingDetalle(false);
  }

  // ── GUARDAR EDICIÓN INDIVIDUAL ──
  async function guardarEdicion() {
    if (!editandoDeuda || !nuevoMonto) return;
    setGuardandoEdit(true);
    const monto = parseFloat(nuevoMonto.replace(/[^0-9.]/g, ""));
    if (isNaN(monto)) { setGuardandoEdit(false); return; }
    await supabase.from("deudas_residentes").update({
      monto_original: monto,
      precio_m1: monto,
      precio_m2: monto,
      precio_m3: monto,
      saldo_pendiente: monto,
    }).eq("id", editandoDeuda.id);
    // Refrescar detalles
    const { data } = await supabase
      .from("deudas_residentes")
      .select("*, residentes(nombre), causaciones_globales(mes_causado, tipo_cobro)")
      .eq("causacion_id", causacionActiva.id)
      .order("unidad", { ascending: true });
    if (data) setDeudasDetalle(data);
    setEditandoDeuda(null);
    setNuevoMonto("");
    setGuardandoEdit(false);
  }

  async function generarCausacion() {
    if (role === "contador") return alert("No tienes permiso para generar causaciones.");
    if (!conceptoId || !mesDeuda || !fechaLimite) return;
    const concepto = conceptos.find(c => c.id === parseInt(conceptoId));
    if (!concepto || !confirm(`¿Confirmar cobros para ${residentesAfectados.length} unidades?`)) return;
    setGenerando(true);
    try {
      const [anio, mesNum] = mesDeuda.split("-");
      const MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      const periodoTexto = `${MESES[parseInt(mesNum) - 1]} ${anio}`;
      const nombreConPeriodo = `${concepto.nombre.trim().toUpperCase()} (${periodoTexto})`;
      const nombreAnticipo = `ANTICIPO - ${concepto.nombre.trim().toUpperCase()} (${periodoTexto})`;
      const { data: anticiposExistentes } = await supabase.from("deudas_residentes").select("id, residente_id, saldo_pendiente, precio_m1").eq("concepto_nombre", nombreAnticipo);
      const anticiposPorResidente: Record<number, any> = {};
      (anticiposExistentes || []).forEach(a => { anticiposPorResidente[a.residente_id] = a; });
      const { data: lote, error: errLote } = await supabase.from("causaciones_globales")
        .insert([{ mes_causado: mesDeuda, concepto_nombre: nombreConPeriodo, total_residentes: residentesAfectados.length, fecha_limite: fechaLimite, tipo_cobro: "NORMAL" }])
        .select().single();
      if (errLote) throw errLote;
      const deudasAInsertar: any[] = [];
      const anticiposAActualizar: Array<{ id: number; nuevoSaldo: number }> = [];
      for (const res of residentesAfectados) {
        let factor = 1;
        const nombreC = concepto.nombre.toUpperCase();
        if (concepto.cobro_por_vehiculo) {
          if (nombreC.includes("CARRO")) factor = Number(res.carros) || 0;
          else if (nombreC.includes("MOTO")) factor = Number(res.motos) || 0;
          else if (nombreC.includes("BICI")) factor = Number(res.bicis) || 0;
        }
        if (factor === 0) continue;
        const montoBase = (Number(concepto.monto_1_10) || 0) * factor;
        const montoM2 = (Number(concepto.monto_11_20) || montoBase) * factor;
        const montoM3 = (Number(concepto.monto_21_adelante) || montoBase) * factor;
        const anticipo = anticiposPorResidente[res.id];
        if (anticipo) {
          const valorPagado = Math.abs(Number(anticipo.saldo_pendiente));
          if (valorPagado >= montoBase) {
            deudasAInsertar.push({ causacion_id: lote.id, residente_id: res.id, unidad: `T${res.torre.slice(-1)}-${res.apartamento}`, concepto_nombre: nombreConPeriodo, monto_original: montoBase, precio_m1: montoBase, precio_m2: montoM2, precio_m3: montoM3, saldo_pendiente: 0, fecha_vencimiento: fechaLimite, estado: "PAGADO" });
            anticiposAActualizar.push({ id: anticipo.id, nuevoSaldo: 0 });
          } else {
            const diferencia = montoBase - valorPagado;
            deudasAInsertar.push({ causacion_id: lote.id, residente_id: res.id, unidad: `T${res.torre.slice(-1)}-${res.apartamento}`, concepto_nombre: nombreConPeriodo, monto_original: montoBase, precio_m1: diferencia, precio_m2: montoM2 - valorPagado, precio_m3: montoM3 - valorPagado, saldo_pendiente: diferencia, fecha_vencimiento: fechaLimite, estado: "PENDIENTE" });
            anticiposAActualizar.push({ id: anticipo.id, nuevoSaldo: 0 });
          }
        } else {
          deudasAInsertar.push({ causacion_id: lote.id, residente_id: res.id, unidad: `T${res.torre.slice(-1)}-${res.apartamento}`, concepto_nombre: nombreConPeriodo, monto_original: montoBase, precio_m1: montoBase, precio_m2: montoM2, precio_m3: montoM3, saldo_pendiente: montoBase, fecha_vencimiento: fechaLimite, estado: "PENDIENTE" });
        }
      }
      if (deudasAInsertar.length > 0) await supabase.from("deudas_residentes").insert(deudasAInsertar);
      for (const { id, nuevoSaldo } of anticiposAActualizar) {
        await supabase.from("deudas_residentes").update({ saldo_pendiente: nuevoSaldo, estado: "APLICADO" }).eq("id", id);
      }
      await cargarDatos();
      setConceptoId("");
      setModoSeleccion(false);
      setResidentesSeleccionados(new Set());
      alert(`Causación completada.\n· ${deudasAInsertar.length - anticiposAActualizar.length} cobros normales\n${anticiposAActualizar.length > 0 ? `· ${anticiposAActualizar.length} anticipos aplicados` : ""}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerando(false);
    }
  }

  const MESES_NOMBRES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;
  const conteoFiltro = (key: string) => residentes.filter(r => {
    if (key === "TODOS") return true;
    if (key === "CARRO") return (r.carros || 0) > 0;
    if (key === "MOTO") return (r.motos || 0) > 0;
    if (key === "BICI") return (r.bicis || 0) > 0;
    return false;
  }).length;

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={28} />
    </div>
  );

  const filtroTabs = [
    { key: "TODOS", label: "General", labelShort: "Gral.", icon: <Users size={13} />, count: conteoFiltro("TODOS") },
    { key: "CARRO", label: "Carros", labelShort: "Carros", icon: <Car size={13} />, count: conteoFiltro("CARRO") },
    { key: "MOTO", label: "Motos", labelShort: "Motos", icon: <Zap size={13} />, count: conteoFiltro("MOTO") },
    { key: "BICI", label: "Bicis", labelShort: "Bicis", icon: <Bike size={13} />, count: conteoFiltro("BICI") },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5 pb-24 font-sans text-slate-800">

      {/* ── GENERADOR ─────────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">

        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-900/20">
            <Zap size={17} className="text-emerald-400" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-slate-900 font-black text-sm sm:text-base leading-none tracking-tight">
              Generar cobros masivos
            </h2>
            <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium mt-0.5">
              Los anticipos se aplican automáticamente
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-4 sm:space-y-5">

          {/* Campos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-0.5">Concepto</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition-all appearance-none cursor-pointer"
                value={conceptoId}
                onChange={e => setConceptoId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {conceptos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-0.5">Mes</label>
              <input type="month" className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition-all" onChange={e => setMesDeuda(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-0.5">Fecha límite</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition-all" onChange={e => setFechaLimite(e.target.value)} />
            </div>
          </div>

          {/* ── FILTRO TIPO (tabs) ── */}
          <div>
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-0.5 mb-2 block">Aplicar a</label>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl sm:rounded-2xl">
              {filtroTabs.map(({ key, label, labelShort, icon, count }) => {
                const activo = filtroTipo === key;
                return (
                  <button key={key} onClick={() => { setFiltroTipo(key); setResidentesSeleccionados(new Set()); }}
                    className={`flex items-center justify-center gap-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[11px] font-black transition-all duration-200
                      ${activo ? "bg-white text-slate-900 shadow-sm shadow-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <span className={`flex-shrink-0 ${activo ? "text-emerald-500" : ""}`}>{icon}</span>
                    <span className="hidden sm:inline uppercase tracking-wide">{label}</span>
                    <span className="sm:hidden uppercase tracking-wide text-[8px]">{labelShort}</span>
                    <span className={`text-[8px] sm:text-[9px] font-black tabular-nums px-1 sm:px-1.5 py-0.5 rounded-md leading-none
                      ${activo ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TOGGLE SELECCIÓN MANUAL ── */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <button
              onClick={() => { setModoSeleccion(!modoSeleccion); setResidentesSeleccionados(new Set()); }}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-black text-[11px] uppercase tracking-widest transition-all
                ${modoSeleccion
                  ? "bg-violet-50 border-violet-300 text-violet-700"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              <UserCheck size={14} />
              {modoSeleccion ? "Selección manual activa" : "Elegir residentes específicos"}
            </button>

            <div className="flex-1 flex items-center justify-end">
              <span className={`text-[11px] font-black px-3 py-1.5 rounded-xl
                ${modoSeleccion && residentesSeleccionados.size === 0
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                {modoSeleccion
                  ? residentesSeleccionados.size === 0
                    ? "Ningún residente seleccionado"
                    : `${residentesSeleccionados.size} residente${residentesSeleccionados.size !== 1 ? "s" : ""} seleccionado${residentesSeleccionados.size !== 1 ? "s" : ""}`
                  : `${residentesPorTipo.length} residente${residentesPorTipo.length !== 1 ? "s" : ""} (todos)`}
              </span>
            </div>

            <button
              onClick={generarCausacion}
              disabled={generando || !conceptoId || !mesDeuda || !fechaLimite || (modoSeleccion && residentesSeleccionados.size === 0)}
              className="sm:w-40 bg-slate-900 text-white py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0 shadow-lg shadow-slate-900/20 hover:shadow-emerald-500/20"
            >
              {generando
                ? <><Loader2 className="animate-spin" size={15} /><span>Procesando...</span></>
                : <><Zap size={14} strokeWidth={2.5} /><span>Procesar</span></>}
            </button>
          </div>

          {/* ── SELECTOR DE RESIDENTES (cuando modoSeleccion = true) ── */}
          {modoSeleccion && (
            <div className="border border-violet-200 bg-violet-50/30 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
              {/* Header del selector */}
              <div className="flex items-center justify-between px-4 py-3 bg-violet-50 border-b border-violet-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">
                  Seleccionar residentes
                </p>
                <div className="flex gap-2">
                  <button onClick={seleccionarTodos} className="text-[9px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-800 px-2 py-1 hover:bg-violet-100 rounded-lg transition-colors">
                    Todos
                  </button>
                  <button onClick={limpiarSeleccion} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors">
                    Limpiar
                  </button>
                </div>
              </div>
              {/* Búsqueda */}
              <div className="px-3 py-2.5 border-b border-violet-100">
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar residente, torre, apto..."
                    value={busquedaResidente}
                    onChange={e => setBusquedaResidente(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:border-violet-400 transition"
                  />
                </div>
              </div>
              {/* Lista */}
              <div className="max-h-52 overflow-y-auto divide-y divide-violet-50">
                {residentesFiltradosSelector.map(r => {
                  const sel = residentesSeleccionados.has(r.id);
                  return (
                    <button key={r.id} onClick={() => toggleResidente(r.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${sel ? "bg-violet-100/60" : "hover:bg-white/60"}`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all
                        ${sel ? "bg-violet-600 border-violet-600" : "border-slate-300 bg-white"}`}>
                        {sel && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0
                        ${sel ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                        T{r.torre?.slice(-1)}-{r.apartamento}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 truncate">{r.nombre}</span>
                      {sel && <CheckCircle2 size={14} className="text-violet-500 ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
                {residentesFiltradosSelector.length === 0 && (
                  <p className="text-center py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin resultados</p>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── HISTORIAL ─────────────────────────────────────────────────── */}
      <div className="space-y-2 sm:space-y-3">
        {mesesOrdenados.map(mesKey => {
          const [anio, mesNum] = mesKey.split("-");
          const nombreMes = `${MESES_NOMBRES[parseInt(mesNum) - 1]} ${anio}`;
          const abierto = mesesAbiertos[mesKey] ?? false;
          const items = historialAgrupado[mesKey];
          return (
            <div key={mesKey} className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">

              <button
                onClick={() => setMesesAbiertos(prev => ({ ...prev, [mesKey]: !prev[mesKey] }))}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-50 transition-colors">
                    <Calendar size={13} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <span className="font-black text-slate-800 text-sm sm:text-base uppercase tracking-tight">{nombreMes}</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                    {items.length} concepto{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${abierto ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {abierto ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
                </div>
              </button>

              {abierto && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {items.map(h => {
                    const modoActual = h.tipo_cobro || "NORMAL";
                    return (
                      <div key={h.id} className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <History size={14} className="text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-xs sm:text-sm text-slate-800 truncate uppercase tracking-tight">{h.concepto_nombre}</p>
                            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 mt-0.5">{h.total_residentes} unidades</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5">
                            {[{ key: "M1", label: "Desc." }, { key: "M2", label: "S/Desc." }, { key: "NORMAL", label: "Auto" }].map(({ key, label }) => {
                              const active = modoActual === key;
                              return (
                                <button key={key} onClick={() => cambiarModo(h.id, key)}
                                  className={`px-2.5 sm:px-3 py-1.5 rounded-[10px] text-[9px] sm:text-[10px] font-black transition-all duration-200
                                    ${active ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                >{label}</button>
                              );
                            })}
                          </div>
                          <button onClick={() => verDetalles(h)} title="Ver detalle"
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-95">
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (role === "contador") return alert("Sin permiso.");
                              if (confirm("¿Borrar esta causación y sus deudas?")) { await supabase.from("causaciones_globales").delete().eq("id", h.id); cargarDatos(); }
                            }}
                            title="Eliminar"
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 text-slate-300 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {mesesOrdenados.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-slate-300" size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Sin causaciones registradas</p>
          </div>
        )}
      </div>

      {/* ── MODAL DETALLE ─────────────────────────────────────────────── */}
      {showDetalles && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[500] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

            {/* Header modal */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye size={15} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-sm leading-none">Detalle de causación</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{causacionActiva?.concepto_nombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => imprimirCausacion(causacionActiva, deudasDetalle, calcularValorDeudaHoy)}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 text-white rounded-xl text-[10px] sm:text-xs font-black hover:bg-emerald-600 transition-all active:scale-95"
                >
                  <Printer size={13} />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
                <button onClick={() => setShowDetalles(false)}
                  className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 border-b border-slate-100 flex-shrink-0">
              {[
                { label: "Pagado", value: fmt(deudasDetalle.reduce((acc, d) => acc + (Number(d.monto_original) - Number(d.saldo_pendiente)), 0)), color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Por cobrar", value: fmt(deudasDetalle.reduce((acc, d) => acc + Number(d.saldo_pendiente), 0)), color: "text-rose-600", bg: "bg-rose-50" },
                { label: "Unidades", value: String(deudasDetalle.length), color: "text-slate-700", bg: "bg-slate-50" },
              ].map(({ label, value, color, bg }, i) => (
                <div key={label} className={`px-4 sm:px-6 py-3 sm:py-4 ${i < 2 ? "border-r border-slate-100" : ""} ${bg}`}>
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                  <p className={`font-black text-base sm:text-lg tabular-nums leading-none ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Buscador + tabs */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 space-y-2.5 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                <input
                  placeholder="Buscar unidad o nombre..."
                  className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-9 pr-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:bg-white transition-all"
                  value={busquedaDetalle}
                  onChange={e => setBusquedaDetalle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { key: "TODOS", label: "Todos", count: deudasDetalle.length, activeColor: "bg-slate-900 text-white" },
                  { key: "PENDIENTE", label: "Sin pago", count: cntPendiente, activeColor: "bg-rose-600 text-white" },
                  { key: "ABONO", label: "Abono", count: cntAbono, activeColor: "bg-amber-500 text-white" },
                  { key: "PAGADO", label: "Pagados", count: cntPagado, activeColor: "bg-emerald-500 text-white" },
                ].map(({ key, label, count, activeColor }) => (
                  <button key={key} onClick={() => setFiltroModal(key as any)}
                    className={`py-2 rounded-lg text-[9px] sm:text-[10px] font-black transition-all flex items-center justify-center gap-1
                      ${filtroModal === key ? activeColor : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <span>{label}</span>
                    <span className={`tabular-nums ${filtroModal === key ? "opacity-70" : ""}`}>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla */}
            <div className="flex-1 overflow-y-auto">
              {loadingDetalle ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="animate-spin text-slate-300" size={24} />
                </div>
              ) : deudasFiltradas.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Sin coincidencias</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 sm:px-6 py-2.5 text-left text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Unidad</th>
                      <th className="px-2 py-2.5 text-left text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Residente</th>
                      <th className="px-4 sm:px-6 py-2.5 text-right text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Estado</th>
                      {role !== "contador" && (
                        <th className="px-3 py-2.5 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Edit</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {deudasFiltradas.map(d => {
                      const pagado = Number(d.saldo_pendiente) === 0;
                      const abono = !pagado && Number(d.monto_original) > Number(d.saldo_pendiente);
                      const abonadoAmt = Number(d.monto_original) - Number(d.saldo_pendiente);
                      return (
                        <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${pagado ? "opacity-50" : ""}`}>
                          <td className="px-4 sm:px-6 py-3">
                            <span className={`inline-block font-black text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg
                              ${pagado ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"}`}>
                              {d.unidad}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <p className="font-semibold text-xs sm:text-sm text-slate-800 leading-none">{d.residentes?.nombre}</p>
                            {abono && <p className="text-[9px] sm:text-[10px] font-black text-amber-500 mt-0.5">Abonó {fmt(abonadoAmt)}</p>}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-right">
                            <span className={`font-black text-xs sm:text-sm tabular-nums ${pagado ? "text-emerald-500" : abono ? "text-amber-600" : "text-rose-600"}`}>
                              {pagado ? fmt(Number(d.monto_original)) : fmt(calcularValorDeudaHoy(d))}
                            </span>
                            <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest mt-0.5 ${pagado ? "text-emerald-400" : abono ? "text-amber-400" : "text-rose-400"}`}>
                              {pagado ? "PAGADO" : abono ? "PARCIAL" : "PENDIENTE"}
                            </p>
                          </td>
                          {role !== "contador" && (
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() => { setEditandoDeuda(d); setNuevoMonto(String(d.monto_original)); }}
                                className="w-7 h-7 bg-slate-100 hover:bg-violet-500 hover:text-white text-slate-400 rounded-lg flex items-center justify-center mx-auto transition-all active:scale-95"
                                title="Editar monto"
                              >
                                <Pencil size={11} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL EDICIÓN INDIVIDUAL ──────────────────────────────────── */}
      {editandoDeuda && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center">
                  <Pencil size={16} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-[13px]">Editar causación</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{editandoDeuda.unidad} · {editandoDeuda.residentes?.nombre}</p>
                </div>
              </div>
              <button onClick={() => setEditandoDeuda(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Nuevo monto</label>
                <input
                  type="number"
                  value={nuevoMonto}
                  onChange={e => setNuevoMonto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] font-black text-slate-800 outline-none focus:border-violet-400 transition tabular-nums"
                  placeholder="0"
                  autoFocus
                />
                <p className="text-[9px] text-slate-400 mt-1.5 ml-1">
                  Actual: <span className="font-black text-slate-600">{fmt(Number(editandoDeuda.monto_original))}</span>
                  {" · "}Saldo: <span className="font-black text-rose-500">{fmt(Number(editandoDeuda.saldo_pendiente))}</span>
                </p>
              </div>
              <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 font-semibold leading-relaxed">
                ⚠️ Esto actualizará el monto original y el saldo pendiente de esta causación individual.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setEditandoDeuda(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition active:scale-95">
                Cancelar
              </button>
              <button onClick={guardarEdicion} disabled={guardandoEdit}
                className="flex-1 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-[11px] uppercase tracking-widest transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20">
                {guardandoEdit ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {guardandoEdit ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}