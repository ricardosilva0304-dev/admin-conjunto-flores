"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  Zap, History, Trash2, Eye, X, Loader2,
  CheckCircle2, Calendar, LayoutGrid, Search, ChevronDown, ChevronUp, Printer,
  Users, DollarSign, FileText
} from "lucide-react";

function imprimirAuditoria(causacionActiva: any, deudasDetalle: any[], calcularValorDeudaHoy: (d: any) => number) {
  const hoy = new Date();
  const fechaStr = hoy.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase();

  const torreIndex = (unidad: string) => {
    const letra = unidad?.charAt(1);
    const orden: Record<string, number> = { "5": 0, "6": 1, "7": 2, "8": 3 };
    return orden[letra] ?? 99;
  };

  const sorted = [...deudasDetalle].sort((a, b) => {
    const ti = torreIndex(a.unidad) - torreIndex(b.unidad);
    if (ti !== 0) return ti;
    return (a.unidad || "").localeCompare(b.unidad || "");
  });

  const porTorre: Record<string, any[]> = {};
  sorted.forEach(d => {
    const t = d.unidad?.charAt(1) ? `Torre ${d.unidad.charAt(1)}` : "Otras";
    if (!porTorre[t]) porTorre[t] = [];
    porTorre[t].push(d);
  });

  const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;
  const totalRecaudado = deudasDetalle.reduce((acc, d) => acc + (Number(d.monto_original) - Number(d.saldo_pendiente)), 0);
  const totalPorCobrar = deudasDetalle.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);

  let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
  <title>Auditoría – ${causacionActiva?.concepto_nombre}</title>
  <style>
    @page { margin: 18mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10pt; color: #1f2937; background: #fff; line-height: 1.4; }
    .enc { display: flex; flex-direction: column; gap: 12px; padding: 24px 20px 20px; border-bottom: 3px solid #111827; margin-bottom: 24px; }
    .enc h1 { font-size: 22pt; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; }
    .enc .sub { font-size: 9pt; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; }
    .enc .concepto { font-size: 12pt; font-weight: 800; text-transform: uppercase; }
    .enc .fecha { font-size: 9pt; color: #9ca3af; font-weight: 600; }
    .resumen { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .card { padding: 16px 20px; border-radius: 12px; }
    .card.verde { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; }
    .card.rojo { background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); border: 2px solid #ef4444; }
    .card .lbl { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .card.verde .lbl { color: #047857; }
    .card.rojo .lbl { color: #b91c1c; }
    .card .val { font-size: 18pt; font-weight: 900; }
    .card.verde .val { color: #065f46; }
    .card.rojo .val { color: #991b1b; }
    .torre { font-size: 10pt; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #111827, #1f2937); padding: 8px 16px; border-radius: 8px; margin: 20px 0 12px; display: inline-block; }
    .sec-lbl { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0 8px; padding: 6px 12px; border-radius: 6px; display: inline-block; }
    .s-pag { background: #d1fae5; color: #065f46; }
    .s-abo { background: #fed7aa; color: #92400e; }
    .s-pen { background: #fecaca; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; padding: 12px 8px; border-bottom: 2px solid #e5e7eb; text-align: left; font-family: inherit; }
    th:last-child, td:last-child { text-align: right; }
    td { font-size: 9pt; padding: 10px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .uni { font-weight: 900; font-size: 9pt; background: #111827; color: #fff; padding: 4px 8px; border-radius: 6px; }
    .uni.v { background: #10b981; }
    .nom { font-weight: 700; }
    .gris { color: #9ca3af; font-size: 8pt; }
    .mp { color: #10b981; font-weight: 900; }
    .mr { color: #ef4444; font-weight: 900; }
    .pie { margin-top: 32px; border-top: 2px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .pie p { font-size: 8pt; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    @media (max-width: 768px) {
      .enc { flex-direction: column; text-align: center; padding: 20px 16px; }
      .resumen { grid-template-columns: 1fr; gap: 12px; }
      .enc .concepto { text-align: center; }
    }
  </style></head><body>
  <div class="enc">
    <div><h1>Auditoría Detallada</h1><p class="sub">Parque de las Flores · Admin Pro</p></div>
    <div><div class="concepto">${causacionActiva?.concepto_nombre}</div><div class="fecha">Generado: ${fechaStr}</div></div>
  </div>
  <div class="resumen">
    <div class="card verde"><div class="lbl">Recaudado</div><div class="val">${fmt(totalRecaudado)}</div></div>
    <div class="card rojo"><div class="lbl">Por Cobrar</div><div class="val">${fmt(totalPorCobrar)}</div></div>
  </div>`;

  Object.entries(porTorre).forEach(([torre, deudas]) => {
    const pagados = deudas.filter(d => Number(d.saldo_pendiente) === 0);
    const abonados = deudas.filter(d => Number(d.saldo_pendiente) > 0 && Number(d.monto_original) > Number(d.saldo_pendiente));
    const pendientes = deudas.filter(d => Number(d.saldo_pendiente) > 0 && Number(d.monto_original) <= Number(d.saldo_pendiente));

    html += `<div class="torre">${torre}</div>`;

    const renderGrupo = (lista: any[], tipo: "pagado" | "abono" | "pendiente") => {
      if (lista.length === 0) return "";
      const labels = { pagado: "✓ Pagados", abono: "◑ Con Abono — Saldo Pendiente", pendiente: "✗ Sin Pago" };
      const cls = { pagado: "s-pag", abono: "s-abo", pendiente: "s-pen" };
      let rows = lista.map(d => {
        const valorHoy = calcularValorDeudaHoy(d);
        const abonado = Number(d.monto_original) - Number(d.saldo_pendiente);
        if (tipo === "pagado") return `<tr>
          <td><span class="uni v">${d.unidad}</span></td>
          <td class="nom">${d.residentes?.nombre || "—"}</td>
          <td class="mp">${fmt(Number(d.monto_original))}</td></tr>`;
        if (tipo === "abono") return `<tr>
          <td><span class="uni">${d.unidad}</span></td>
          <td class="nom">${d.residentes?.nombre || "—"}<br><span class="gris">Abonó: ${fmt(abonado)}</span></td>
          <td class="mr">${fmt(valorHoy)}</td></tr>`;
        return `<tr>
          <td><span class="uni">${d.unidad}</span></td>
          <td class="nom">${d.residentes?.nombre || "—"}</td>
          <td class="mr">${fmt(valorHoy)}</td></tr>`;
      }).join("");
      return `<div class="sec-lbl ${cls[tipo]}">${labels[tipo]} (${lista.length})</div>
        <table><thead><tr><th>Unidad</th><th>Residente</th><th>${tipo === "pagado" ? "Valor" : "Saldo"}</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
    };

    html += renderGrupo(pagados, "pagado");
    html += renderGrupo(abonados, "abono");
    html += renderGrupo(pendientes, "pendiente");
  });

  html += `<div class="pie"><p>Admin Pro · Parque de las Flores</p><p>Total: ${deudasDetalle.length} unidades</p></div>
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
      supabase.from("causaciones_globales").select("*").order('mes_causado', { ascending: false })
    ]);
    if (c.data) setConceptos(c.data);
    if (r.data) setResidentes(r.data);
    if (h.data) {
      setHistorial(h.data);
      if (h.data.length > 0) {
        const primerMes = h.data[0].mes_causado;
        setMesesAbiertos({ [primerMes]: true });
      }
    }
    setLoading(false);
  }

  const historialAgrupado = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    historial.forEach(h => {
      const mes = h.mes_causado;
      if (!grupos[mes]) grupos[mes] = [];
      grupos[mes].push(h);
    });
    return grupos;
  }, [historial]);

  const mesesOrdenados = Object.keys(historialAgrupado).sort().reverse();

  const deudasFiltradas = useMemo(() => {
    return deudasDetalle.filter((d: any) =>
      d.unidad?.toLowerCase().includes(busquedaDetalle.toLowerCase()) ||
      d.residentes?.nombre?.toLowerCase().includes(busquedaDetalle.toLowerCase())
    );
  }, [deudasDetalle, busquedaDetalle]);

  async function cambiarModo(id: number, nuevoModo: string) {
    if (role === 'contador') return alert("No tienes permiso para modificar causaciones.");
    setHistorial(prev => prev.map(h => h.id === id ? { ...h, tipo_cobro: nuevoModo } : h));
    await supabase.from("causaciones_globales").update({ tipo_cobro: nuevoModo }).eq("id", id);
  }

  async function verDetalles(causacion: any) {
    setCausacionActiva(causacion);
    setShowDetalles(true);
    setLoadingDetalle(true);
    setBusquedaDetalle("");
    const { data } = await supabase
      .from("deudas_residentes")
      .select(`*, residentes(nombre), causaciones_globales(mes_causado, tipo_cobro)`)
      .eq("causacion_id", causacion.id)
      .order('unidad', { ascending: true });
    if (data) setDeudasDetalle(data);
    setLoadingDetalle(false);
  }

  async function generarCausacion() {
    if (role === 'contador') return alert("No tienes permiso para generar causaciones.");
    if (!conceptoId || !mesDeuda || !fechaLimite) return;
    const concepto = conceptos.find(c => c.id === parseInt(conceptoId));
    if (!concepto || !confirm(`¿Confirmar cobros para ${residentesAfectados.length} unidades?`)) return;

    setGenerando(true);
    try {
      const [anio, mesNum] = mesDeuda.split("-");
      const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      const periodoTexto = `${mesesNombres[parseInt(mesNum) - 1]} ${anio}`;
      const nombreConPeriodo = `${concepto.nombre.trim().toUpperCase()} (${periodoTexto})`;

      const nombreAnticipo = `ANTICIPO - ${concepto.nombre.trim().toUpperCase()} (${periodoTexto})`;

      const { data: anticiposExistentes } = await supabase
        .from("deudas_residentes")
        .select("id, residente_id, saldo_pendiente, precio_m1")
        .eq("concepto_nombre", nombreAnticipo);

      const anticiposPorResidente: Record<number, any> = {};
      (anticiposExistentes || []).forEach(a => {
        anticiposPorResidente[a.residente_id] = a;
      });

      const { data: lote, error: errLote } = await supabase
        .from("causaciones_globales")
        .insert([{
          mes_causado: mesDeuda,
          concepto_nombre: nombreConPeriodo,
          total_residentes: residentesAfectados.length,
          fecha_limite: fechaLimite,
          tipo_cobro: 'NORMAL'
        }])
        .select()
        .single();

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
            deudasAInsertar.push({
              causacion_id: lote.id,
              residente_id: res.id,
              unidad: `T${res.torre.slice(-1)}-${res.apartamento}`,
              concepto_nombre: nombreConPeriodo,
              monto_original: montoBase,
              precio_m1: montoBase,
              precio_m2: montoM2,
              precio_m3: montoM3,
              saldo_pendiente: 0,
              fecha_vencimiento: fechaLimite,
              estado: "PAGADO"
            });
            anticiposAActualizar.push({ id: anticipo.id, nuevoSaldo: 0 });
          } else {
            const diferencia = montoBase - valorPagado;
            deudasAInsertar.push({
              causacion_id: lote.id,
              residente_id: res.id,
              unidad: `T${res.torre.slice(-1)}-${res.apartamento}`,
              concepto_nombre: nombreConPeriodo,
              monto_original: montoBase,
              precio_m1: diferencia,
              precio_m2: montoM2 - valorPagado,
              precio_m3: montoM3 - valorPagado,
              saldo_pendiente: diferencia,
              fecha_vencimiento: fechaLimite,
              estado: "PENDIENTE"
            });
            anticiposAActualizar.push({ id: anticipo.id, nuevoSaldo: 0 });
          }
        } else {
          deudasAInsertar.push({
            causacion_id: lote.id,
            residente_id: res.id,
            unidad: `T${res.torre.slice(-1)}-${res.apartamento}`,
            concepto_nombre: nombreConPeriodo,
            monto_original: montoBase,
            precio_m1: montoBase,
            precio_m2: montoM2,
            precio_m3: montoM3,
            saldo_pendiente: montoBase,
            fecha_vencimiento: fechaLimite,
            estado: "PENDIENTE"
          });
        }
      }

      if (deudasAInsertar.length > 0) {
        await supabase.from("deudas_residentes").insert(deudasAInsertar);
      }

      for (const { id, nuevoSaldo } of anticiposAActualizar) {
        await supabase
          .from("deudas_residentes")
          .update({ saldo_pendiente: nuevoSaldo, estado: "APLICADO" })
          .eq("id", id);
      }

      const conAnticipo = anticiposAActualizar.length;
      const sinAnticipo = deudasAInsertar.length - conAnticipo;

      await cargarDatos();
      setConceptoId("");
      alert(
        `✅ Causación completada.\n` +
        `· ${sinAnticipo} cobros normales generados\n` +
        (conAnticipo > 0 ? `· ${conAnticipo} anticipos aplicados automáticamente` : "")
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerando(false);
    }
  }

  const residentesAfectados = residentes.filter(r => {
    if (filtroTipo === "TODOS") return true;
    if (filtroTipo === "CARRO") return (r.carros || 0) > 0;
    if (filtroTipo === "MOTO") return (r.motos || 0) > 0;
    if (filtroTipo === "BICI") return (r.bicis || 0) > 0;
    return false;
  });

  const MESES_NOMBRES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-emerald-500" size={36} />
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Cargando causaciones...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

        {/* ── HEADER ── */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight bg-gradient-to-r from-slate-900 to-emerald-700 bg-clip-text text-transparent mb-2">
            Causaciones
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-2xl mx-auto">
            Gestión profesional de cobros masivos para Parque de las Flores
          </p>
        </div>

        {/* ── GENERADOR ────────────────────────────────────────── */}
        <section className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 lg:p-10 rounded-3xl border border-white/50 shadow-xl shadow-emerald-100/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                  Generar Cobros Masivos
                </h2>
                <p className="text-xs sm:text-sm text-emerald-600 font-semibold uppercase tracking-wider mt-1">
                  Anticipos aplicados automáticamente
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Concepto</label>
              <select
                className="w-full bg-white/50 border border-slate-200 p-4 rounded-2xl text-sm font-semibold backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
                value={conceptoId}
                onChange={(e) => setConceptoId(e.target.value)}
              >
                <option value="">Seleccionar servicio...</option>
                {conceptos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Mes</label>
              <input
                type="month"
                className="w-full bg-white/50 border border-slate-200 p-4 rounded-2xl text-sm font-semibold backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
                value={mesDeuda}
                onChange={(e) => setMesDeuda(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Vencimiento</label>
              <input
                type="date"
                className="w-full bg-white/50 border border-slate-200 p-4 rounded-2xl text-sm font-semibold backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
              />
            </div>

            <div>
              <button
                onClick={generarCausacion}
                disabled={generando || !conceptoId || residentesAfectados.length === 0}
                className="w-full h-[56px] bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:from-emerald-600 hover:to-emerald-700 focus:ring-4 focus:ring-emerald-500/50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                {generando ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Procesar {residentesAfectados.length}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filtros */}
          {residentes.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'TODOS', label: 'Todos', icon: Users },
                  { key: 'CARRO', label: 'Carros', icon: null },
                  { key: 'MOTO', label: 'Motos', icon: null },
                  { key: 'BICI', label: 'Bicis', icon: null }
                ].map(({ key, label, icon: Icon }) => {
                  const count = residentes.filter(r => {
                    if (key === "TODOS") return true;
                    if (key === "CARRO") return (r.carros || 0) > 0;
                    if (key === "MOTO") return (r.motos || 0) > 0;
                    if (key === "BICI") return (r.bicis || 0) > 0;
                    return false;
                  }).length;
                  const activo = filtroTipo === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFiltroTipo(key)}
                      className={`group relative p-3 rounded-2xl transition-all duration-200 font-black text-sm uppercase tracking-wider ${activo
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
                          : 'bg-white/50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 hover:shadow-md'
                        }`}
                    >
                      {Icon && <Icon className={`w-5 h-5 mx-auto mb-1 ${activo ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`} />}
                      <div>{label}</div>
                      <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center bg-white/90 text-slate-900 shadow-lg ${activo ? 'bg-emerald-500 text-white shadow-emerald-500/50' : ''
                        }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── HISTORIAL ───────────────────────────────── */}
        <div className="space-y-4 lg:space-y-6">
          {mesesOrdenados.map(mesKey => {
            const [anio, mesNum] = mesKey.split("-");
            const nombreMes = `${MESES_NOMBRES[parseInt(mesNum) - 1]} ${anio}`;
            const abierto = mesesAbiertos[mesKey] ?? false;
            const items = historialAgrupado[mesKey];

            return (
              <section key={mesKey} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => setMesesAbiertos(prev => ({ ...prev, [mesKey]: !prev[mesKey] }))}
                  className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-slate-50/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-500/25 group-hover:shadow-xl flex-shrink-0">
                      <Calendar className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">{nombreMes}</div>
                      <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                        {items.length} concepto{items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/50 rounded-2xl group-hover:bg-emerald-50 transition-all duration-200">
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${abierto && 'rotate-180'}`}
                    />
                  </div>
                </button>

                {abierto && (
                  <div className="p-1 sm:p-2 bg-gradient-to-b from-slate-50 to-transparent">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6">
                      {items.map(h => (
                        <div key={h.id} className="group bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 rounded-2xl p-6 sm:p-8 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 group-hover:via-emerald-500/10 transition-all duration-300" />

                          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                            <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
                              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center group-hover:from-emerald-100 group-hover:to-emerald-200 transition-all duration-200 flex-shrink-0">
                                <History className="w-6 h-6 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <h4 className="font-black text-sm sm:text-lg text-slate-900 uppercase tracking-tight leading-tight truncate pr-4">
                                  {h.concepto_nombre}
                                </h4>
                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  <span>{h.total_residentes} unidades</span>
                                  <span className="px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                                    {h.fecha_limite}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                              <button
                                onClick={() => verDetalles(h)}
                                className="p-3 sm:p-3.5 bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md rounded-2xl transition-all duration-200 flex items-center justify-center group/icon"
                                title="Ver auditoría"
                              >
                                <Eye className="w-4 h-4 text-slate-500 group-hover/icon:text-emerald-600 transition-colors" />
                              </button>

                              {role !== 'contador' && (
                                <button
                                  onClick={async () => {
                                    if (confirm("¿Eliminar esta causación? Esta acción no se puede deshacer.")) {
                                      await supabase.from("causaciones_globales").delete().eq("id", h.id);
                                      cargarDatos();
                                    }
                                  }}
                                  className="p-3 sm:p-3.5 bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:shadow-md rounded-2xl transition-all duration-200 flex items-center justify-center group/icon"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4 text-slate-500 group-hover/icon:text-rose-600 transition-colors" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-6 pt-6 border-t border-slate-200 relative">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Tipo de cobro</span>
                              <div className="flex bg-slate-50/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200 gap-1">
                                {[
                                  { key: 'M1', label: 'Descuento', active: (h.tipo_cobro || 'NORMAL') === 'M1' },
                                  { key: 'M2', label: 'Normal', active: (h.tipo_cobro || 'NORMAL') === 'M2' },
                                  { key: 'NORMAL', label: 'Automático', active: (h.tipo_cobro || 'NORMAL') === 'NORMAL' }
                                ].map(({ key, label, active }) => (
                                  <button
                                    key={key}
                                    onClick={() => cambiarModo(h.id, key)}
                                    disabled={role === 'contador'}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ${active
                                        ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md shadow-slate-500/25'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'
                                      }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {mesesOrdenados.length === 0 && (
            <div className="text-center py-24 sm:py-32 bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 shadow-lg">
              <CheckCircle2 className="mx-auto w-20 h-20 text-emerald-200 mb-6" />
              <h3 className="text-2xl sm:text-3xl font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                Sin Causaciones
              </h3>
              <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                Usa el generador de arriba para crear tus primeras causaciones masivas
              </p>
            </div>
          )}
        </div>

        {/* ── MODAL AUDITORÍA ───────────────────────────────── */}
        {showDetalles && (
          <>
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] animate-in fade-in duration-300"
              onClick={() => setShowDetalles(false)}
            />
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in zoom-in-95 duration-300">
              <div
                className="bg-white w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <LayoutGrid className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        Auditoría Completa
                      </h3>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1 truncate max-w-md">
                        {causacionActiva?.concepto_nombre}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => imprimirAuditoria(causacionActiva, deudasDetalle, calcularValorDeudaHoy)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                    <button
                      onClick={() => setShowDetalles(false)}
                      className="w-12 h-12 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:border-rose-300 hover:shadow-md transition-all duration-200"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Search & Stats */}
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      placeholder="Buscar unidad o residente..."
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm"
                      value={busquedaDetalle}
                      onChange={(e) => setBusquedaDetalle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="group p-6 sm:p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Recaudado</span>
                      </div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-700 tabular-nums">
                        ${deudasDetalle.reduce((acc, d) => acc + (Number(d.monto_original) - Number(d.saldo_pendiente)), 0).toLocaleString('es-CO')}
                      </div>
                    </div>

                    <div className="group p-6 sm:p-8 bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 rounded-2xl hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-black text-rose-700 uppercase tracking-wider">Por Cobrar</span>
                      </div>
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-rose-700 tabular-nums">
                        ${deudasDetalle.reduce((acc, d) => acc + Number(d.saldo_pendiente), 0).toLocaleString('es-CO')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista */}
                <div className="flex-1 min-h-[300px] overflow-y-auto p-6 sm:p-8 bg-gradient-to-b from-slate-50/50 to-white">
                  {loadingDetalle ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                      <p className="text-lg font-black text-slate-500 uppercase tracking-wider">Cargando detalles...</p>
                    </div>
                  ) : deudasFiltradas.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                      <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                      <p className="text-lg font-black uppercase tracking-[0.1em] text-slate-400">
                        Sin coincidencias
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {deudasFiltradas.map(d => {
                        const pagado = Number(d.saldo_pendiente) === 0;
                        const monto = pagado ? Number(d.monto_original) : calcularValorDeudaHoy(d);
                        return (
                          <div
                            key={d.id}
                            className={`group bg-white border-2 p-5 sm:p-6 lg:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4 sm:gap-6 ${pagado
                                ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
                                : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30'
                              }`}
                          >
                            <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                              <div className={`w-14 h-12 sm:w-16 sm:h-14 lg:w-20 lg:h-16 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl lg:text-2xl shadow-lg flex-shrink-0 ${pagado
                                  ? 'bg-emerald-500 text-white shadow-emerald-500/40'
                                  : 'bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-slate-500/40'
                                }`}>
                                {d.unidad}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-black text-base sm:text-lg lg:text-xl text-slate-900 uppercase tracking-tight truncate">
                                  {d.residentes?.nombre || 'Sin asignar'}
                                </p>
                                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${pagado
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                                  }`}>
                                  {pagado ? 'PAGADO' : 'PENDIENTE'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right sm:text-left flex-shrink-0">
                              <div className={`text-2xl sm:text-3xl lg:text-4xl font-black tabular-nums ${pagado ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                ${monto.toLocaleString('es-CO')}
                              </div>
                              <div className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wider mt-1">
                                {pagado ? 'Original' : 'Actualizado'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-t border-slate-100 text-center">
                  <p className="text-sm font-black text-slate-500 uppercase tracking-[0.1em]">
                    Admin Pro · Parque de las Flores · {deudasDetalle.length} registros
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}