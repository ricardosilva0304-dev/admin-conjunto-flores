"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  Zap, History, Trash2, Eye, X, Loader2,
  CheckCircle2, Calendar, Search, ChevronDown, ChevronUp, Printer
} from "lucide-react";

// ── IMPRESIÓN: solo pendientes y abonados ─────────────────────────────────────
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
    <div>
      <h1>Saldos Pendientes</h1>
      <div class="sub">Parque de las Flores · Administración</div>
    </div>
    <div class="right">
      <div class="concepto">${causacionActiva?.concepto_nombre}</div>
      <div class="fecha">Impreso: ${fechaStr}</div>
    </div>
  </div>
  <div class="resumen">
    <div class="kpi azul"><div class="lbl">Total unidades</div><div class="val">${totalUnidades}</div></div>
    <div class="kpi verde"><div class="lbl">Ya pagaron</div><div class="val">${totalPagadas}</div></div>
    <div class="kpi rojo"><div class="lbl">Sin pagar</div><div class="val">${sinPagar.length}</div></div>
    <div class="kpi gris"><div class="lbl">Por cobrar</div><div class="val" style="font-size:10pt">${fmt(totalPorCobrar)}</div></div>
  </div>
  <p class="nota">Este documento muestra únicamente unidades con saldo pendiente. Las ${totalPagadas} unidades que ya cancelaron no aparecen.</p>
  ${abonados.length > 0 ? `
    <div class="sec-title abono">Con abono — saldo parcial (${abonados.length})</div>
    <table>
      <thead><tr><th>Unidad</th><th>Residente</th><th class="num">Abonado</th><th class="num">Saldo debe</th></tr></thead>
      <tbody>${filas(abonados)}</tbody>
    </table>` : ""}
  ${pendientes.length > 0 ? `
    <div class="sec-title pendiente">Sin ningún pago (${pendientes.length})</div>
    <table>
      <thead><tr><th>Unidad</th><th>Residente</th><th></th><th class="num">Valor debe</th></tr></thead>
      <tbody>${filas(pendientes)}</tbody>
    </table>` : ""}
  <div class="footer">
    <p>Admin · Parque de las Flores</p>
    <p>Recaudado: ${fmt(totalPagado)} / Por cobrar: ${fmt(totalPorCobrar)}</p>
  </div>
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

  const residentesAfectados = useMemo(() => residentes.filter(r => {
    if (filtroTipo === "TODOS") return true;
    if (filtroTipo === "CARRO") return (r.carros || 0) > 0;
    if (filtroTipo === "MOTO") return (r.motos || 0) > 0;
    if (filtroTipo === "BICI") return (r.bicis || 0) > 0;
    return false;
  }), [residentes, filtroTipo]);

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

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-24 font-sans text-slate-800">

      {/* ── GENERADOR ──────────────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-emerald-400" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-sm leading-none">Generar cobros masivos</h2>
            <p className="text-slate-400 text-[10px] mt-0.5">Los anticipos se aplican automáticamente</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Concepto</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-slate-400 focus:bg-white transition-all"
                value={conceptoId}
                onChange={e => setConceptoId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {conceptos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Mes</label>
              <input type="month" className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-slate-400 focus:bg-white transition-all" onChange={e => setMesDeuda(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fecha límite</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-slate-400 focus:bg-white transition-all" onChange={e => setFechaLimite(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { key: "TODOS", label: "General" },
                { key: "CARRO", label: "Carros" },
                { key: "MOTO", label: "Motos" },
                { key: "BICI", label: "Bicis" },
              ].map(({ key, label }) => {
                const activo = filtroTipo === key;
                const count = conteoFiltro(key);
                return (
                  <button key={key} onClick={() => setFiltroTipo(key)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all ${activo ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.slice(0, 3)}</span>
                    <span className={`text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${activo ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={generarCausacion}
              disabled={generando || !conceptoId || !mesDeuda || !fechaLimite}
              className="sm:w-36 bg-slate-900 text-white py-2.5 px-5 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2 flex-shrink-0"
            >
              {generando ? <Loader2 className="animate-spin" size={15} /> : <><Zap size={14} />Procesar</>}
            </button>
          </div>
        </div>
      </section>

      {/* ── HISTORIAL ──────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {mesesOrdenados.map(mesKey => {
          const [anio, mesNum] = mesKey.split("-");
          const nombreMes = `${MESES_NOMBRES[parseInt(mesNum) - 1]} ${anio}`;
          const abierto = mesesAbiertos[mesKey] ?? false;
          const items = historialAgrupado[mesKey];
          return (
            <div key={mesKey} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setMesesAbiertos(prev => ({ ...prev, [mesKey]: !prev[mesKey] }))}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="font-bold text-slate-800 text-sm">{nombreMes}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{items.length} concepto{items.length !== 1 ? "s" : ""}</span>
                </div>
                {abierto ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
              </button>

              {abierto && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {items.map(h => (
                    <div key={h.id} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <History size={14} className="text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{h.concepto_nombre}</p>
                          <p className="text-[10px] text-slate-400">{h.total_residentes} unidades</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
                          {[{ key: "M1", label: "Desc." }, { key: "M2", label: "S/Desc." }, { key: "NORMAL", label: "Auto" }].map(({ key, label }) => {
                            const active = (h.tipo_cobro || "NORMAL") === key;
                            return (
                              <button key={key} onClick={() => cambiarModo(h.id, key)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${active ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                              >{label}</button>
                            );
                          })}
                        </div>
                        <button onClick={() => verDetalles(h)} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all" title="Ver detalle">
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            if (role === "contador") return alert("Sin permiso.");
                            if (confirm("¿Borrar esta causación y sus deudas?")) { await supabase.from("causaciones_globales").delete().eq("id", h.id); cargarDatos(); }
                          }}
                          className="p-2 bg-slate-100 text-slate-300 rounded-lg hover:bg-rose-500 hover:text-white transition-all" title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {mesesOrdenados.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <CheckCircle2 className="mx-auto text-slate-200 mb-3" size={32} />
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Sin causaciones registradas</p>
          </div>
        )}
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────────── */}
      {showDetalles && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[500] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[85vh]">

            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm leading-none">Detalle de causación</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{causacionActiva?.concepto_nombre}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => imprimirCausacion(causacionActiva, deudasDetalle, calcularValorDeudaHoy)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-all"
                >
                  <Printer size={13} /><span>Imprimir</span>
                </button>
                <button onClick={() => setShowDetalles(false)} className="p-2 text-slate-300 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-0 border-b border-slate-100 flex-shrink-0">
              <div className="px-4 sm:px-6 py-3 border-r border-slate-100">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Pagado</p>
                <p className="font-bold text-emerald-600 text-base tabular-nums">{fmt(deudasDetalle.reduce((acc, d) => acc + (Number(d.monto_original) - Number(d.saldo_pendiente)), 0))}</p>
              </div>
              <div className="px-4 sm:px-6 py-3 border-r border-slate-100">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Por cobrar</p>
                <p className="font-bold text-rose-600 text-base tabular-nums">{fmt(deudasDetalle.reduce((acc, d) => acc + Number(d.saldo_pendiente), 0))}</p>
              </div>
              <div className="px-4 sm:px-6 py-3">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Unidades</p>
                <p className="font-bold text-slate-700 text-base tabular-nums">{deudasDetalle.length}</p>
              </div>
            </div>

            <div className="px-4 sm:px-5 py-3 border-b border-slate-100 space-y-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                <input
                  placeholder="Buscar unidad o nombre..."
                  className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 rounded-lg text-sm outline-none focus:border-slate-400 transition-all"
                  value={busquedaDetalle}
                  onChange={e => setBusquedaDetalle(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {[
                  { key: "TODOS", label: "Todos", count: deudasDetalle.length, color: "" },
                  { key: "PENDIENTE", label: "Sin pago", count: cntPendiente, color: "text-rose-500" },
                  { key: "ABONO", label: "Con abono", count: cntAbono, color: "text-amber-500" },
                  { key: "PAGADO", label: "Pagados", count: cntPagado, color: "text-emerald-500" },
                ].map(({ key, label, count, color }) => (
                  <button key={key} onClick={() => setFiltroModal(key as any)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1 ${filtroModal === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 hover:text-slate-600"}`}
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.split(" ")[0]}</span>
                    <span className={`tabular-nums ${filtroModal === key ? "text-slate-300" : color}`}>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingDetalle ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
              ) : deudasFiltradas.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-400">Sin coincidencias</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 sm:px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Unidad</th>
                      <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Residente</th>
                      <th className="px-4 sm:px-5 py-2.5 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Estado / Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {deudasFiltradas.map(d => {
                      const pagado = Number(d.saldo_pendiente) === 0;
                      const abono = !pagado && Number(d.monto_original) > Number(d.saldo_pendiente);
                      const abonadoAmt = Number(d.monto_original) - Number(d.saldo_pendiente);
                      return (
                        <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${pagado ? "opacity-50" : ""}`}>
                          <td className="px-4 sm:px-5 py-3">
                            <span className={`inline-block font-bold text-[11px] px-2 py-1 rounded-md ${pagado ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"}`}>{d.unidad}</span>
                          </td>
                          <td className="px-2 py-3">
                            <p className="font-medium text-sm text-slate-800 leading-none">{d.residentes?.nombre}</p>
                            {abono && <p className="text-[10px] text-amber-500 mt-0.5">Abonó {fmt(abonadoAmt)}</p>}
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-right">
                            <span className={`font-bold text-sm tabular-nums ${pagado ? "text-emerald-500" : abono ? "text-amber-600" : "text-rose-600"}`}>
                              {pagado ? fmt(Number(d.monto_original)) : fmt(calcularValorDeudaHoy(d))}
                            </span>
                            <p className={`text-[9px] font-semibold mt-0.5 ${pagado ? "text-emerald-400" : abono ? "text-amber-400" : "text-rose-400"}`}>
                              {pagado ? "PAGADO" : abono ? "PARCIAL" : "PENDIENTE"}
                            </p>
                          </td>
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
    </div>
  );
}