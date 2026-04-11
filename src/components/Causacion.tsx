"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  Zap, History, Trash2, Eye, X, Loader2,
  CheckCircle2, Calendar, LayoutGrid, Search, ChevronDown, ChevronUp, Printer
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
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9.5pt; color: #1e293b; background: #fff; }
    .enc { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 10px; border-bottom: 2.5px solid #0f172a; margin-bottom: 12px; }
    .enc h1 { font-size: 17pt; font-weight: 900; text-transform: uppercase; line-height: 1; letter-spacing: -0.5px; }
    .enc .sub { font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-top: 3px; }
    .enc .der { text-align: right; }
    .enc .concepto { font-size: 9pt; font-weight: 800; text-transform: uppercase; }
    .enc .fecha { font-size: 7.5pt; color: #94a3b8; font-weight: 600; margin-top: 3px; }
    .resumen { display: flex; gap: 10px; margin-bottom: 14px; }
    .card { flex: 1; padding: 8px 14px; border-radius: 8px; }
    .card.verde { background: #f0fdf4; border: 1.5px solid #bbf7d0; }
    .card.rojo  { background: #fff1f2; border: 1.5px solid #fecdd3; }
    .card .lbl { font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
    .card.verde .lbl { color: #15803d; }
    .card.rojo  .lbl { color: #be123c; }
    .card .val { font-size: 14pt; font-weight: 900; margin-top: 2px; }
    .card.verde .val { color: #166534; }
    .card.rojo  .val { color: #9f1239; }
    .torre { font-size: 8pt; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #fff; background: #0f172a; padding: 5px 12px; border-radius: 6px; margin: 12px 0 6px; display: inline-block; }
    .sec-lbl { font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 8px 0 4px; padding: 3px 8px; border-radius: 4px; display: inline-block; }
    .s-pag { background: #dcfce7; color: #166534; }
    .s-abo { background: #fff7ed; color: #9a3412; }
    .s-pen { background: #fef2f2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    th { font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; padding: 4px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th:last-child, td:last-child { text-align: right; }
    td { font-size: 8.5pt; padding: 5px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .uni { font-weight: 900; font-size: 8pt; background: #0f172a; color: #fff; padding: 2px 6px; border-radius: 4px; }
    .uni.v { background: #16a34a; }
    .nom { font-weight: 700; }
    .gris { color: #94a3b8; font-size: 7.5pt; }
    .mp { color: #16a34a; font-weight: 900; }
    .mr { color: #dc2626; font-weight: 900; }
    .pie { margin-top: 16px; border-top: 1.5px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; }
    .pie p { font-size: 7pt; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 2px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style></head><body>
  <div class="enc">
    <div><h1>Auditoría Detallada</h1><p class="sub">Parque de las Flores · Admin Pro</p></div>
    <div class="der"><div class="concepto">${causacionActiva?.concepto_nombre}</div><div class="fecha">Generado: ${fechaStr}</div></div>
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

export default function Causacion() {
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
    if (!conceptoId || !mesDeuda || !fechaLimite) return;
    const concepto = conceptos.find(c => c.id === parseInt(conceptoId));
    if (!concepto || !confirm(`¿Confirmar cobros para ${residentesAfectados.length} unidades?`)) return;

    setGenerando(true);
    try {
      const [anio, mesNum] = mesDeuda.split("-");
      const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      const periodoTexto = `${mesesNombres[parseInt(mesNum) - 1]} ${anio}`;
      const nombreConPeriodo = `${concepto.nombre.trim().toUpperCase()} (${periodoTexto})`;

      // Nombre con el que se guardaron los anticipos para este concepto+mes
      const nombreAnticipo = `ANTICIPO - ${concepto.nombre.trim().toUpperCase()} (${periodoTexto})`;

      // Consultar todos los anticipos existentes para este concepto+mes de una sola vez
      const { data: anticiposExistentes } = await supabase
        .from("deudas_residentes")
        .select("id, residente_id, saldo_pendiente, precio_m1")
        .eq("concepto_nombre", nombreAnticipo);

      // Indexar por residente_id para búsqueda O(1)
      const anticiposPorResidente: Record<number, any> = {};
      (anticiposExistentes || []).forEach(a => {
        anticiposPorResidente[a.residente_id] = a;
      });

      // Crear el lote de causación
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

      // Construir deudas considerando anticipos
      const deudasAInsertar: any[] = [];
      const anticiposAActualizar: Array<{ id: number; nuevoSaldo: number }> = [];

      for (const res of residentesAfectados) {
        // Calcular factor vehículos
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
          // El residente pagó anticipado
          const valorPagado = Math.abs(Number(anticipo.saldo_pendiente)); // es negativo en DB

          if (valorPagado >= montoBase) {
            // Anticipo cubre el total: insertar con saldo 0 (ya pagado)
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
            // Consumir el anticipo completamente (saldo → 0)
            anticiposAActualizar.push({ id: anticipo.id, nuevoSaldo: 0 });

          } else {
            // Anticipo parcial: insertar solo la diferencia
            // Esto ocurre si subió el precio (ej: pagó $146k pero ahora vale $156k → debe $10k)
            const diferencia = montoBase - valorPagado;
            deudasAInsertar.push({
              causacion_id: lote.id,
              residente_id: res.id,
              unidad: `T${res.torre.slice(-1)}-${res.apartamento}`,
              concepto_nombre: nombreConPeriodo,
              monto_original: montoBase,
              precio_m1: diferencia,  // solo debe la diferencia
              precio_m2: montoM2 - valorPagado,
              precio_m3: montoM3 - valorPagado,
              saldo_pendiente: diferencia,
              fecha_vencimiento: fechaLimite,
              estado: "PENDIENTE"
            });
            // Consumir el anticipo completamente
            anticiposAActualizar.push({ id: anticipo.id, nuevoSaldo: 0 });
          }

        } else {
          // Sin anticipo: flujo normal
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

      // Insertar todas las deudas de una sola vez
      if (deudasAInsertar.length > 0) {
        await supabase.from("deudas_residentes").insert(deudasAInsertar);
      }

      // Actualizar los anticipos consumidos (marcar saldo en 0)
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
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={28} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8 pb-24 px-0 font-sans text-slate-800">

      {/* ── GENERADOR ────────────────────────────────────────── */}
      <section className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-5 sm:mb-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-slate-900 font-black text-xs sm:text-sm uppercase tracking-widest leading-none">
              Generar Cobros Masivos
            </h2>
            <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase mt-0.5 tracking-tighter">
              Planificación financiera del mes · Los anticipos se aplican automáticamente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-end">
          <div className="sm:col-span-2 md:col-span-4 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Concepto de pago</label>
            <select
              className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
              value={conceptoId}
              onChange={(e) => setConceptoId(e.target.value)}
            >
              <option value="">Selecciona servicio...</option>
              {conceptos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Mes</label>
            <input
              type="month"
              className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
              onChange={(e) => setMesDeuda(e.target.value)}
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Vencimiento</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
              onChange={(e) => setFechaLimite(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 md:col-span-2">
            <button
              onClick={generarCausacion}
              disabled={generando || !conceptoId}
              className="w-full bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-xl disabled:opacity-30 flex items-center justify-center"
            >
              {generando ? <Loader2 className="animate-spin" size={18} /> : "PROCESAR"}
            </button>
          </div>
        </div>

        {/* Filtros de tipo */}
        <div className="mt-4 sm:mt-6 flex bg-slate-100 p-1 rounded-2xl gap-1">
          {[
            { key: 'TODOS', label: 'General' },
            { key: 'CARRO', label: 'Carros' },
            { key: 'MOTO', label: 'Motos' },
            { key: 'BICI', label: 'Bicis' },
          ].map(({ key, label }) => {
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${activo ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"}`}
              >
                {label}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg ${activo ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── HISTORIAL AGRUPADO ───────────────────────────────── */}
      <div className="space-y-3 sm:space-y-4">
        {mesesOrdenados.map(mesKey => {
          const [anio, mesNum] = mesKey.split("-");
          const nombreMes = `${MESES_NOMBRES[parseInt(mesNum) - 1]} ${anio}`;
          const abierto = mesesAbiertos[mesKey] ?? false;
          const items = historialAgrupado[mesKey];

          return (
            <div key={mesKey} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">

              <button
                onClick={() => setMesesAbiertos(prev => ({ ...prev, [mesKey]: !prev[mesKey] }))}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-900 text-white px-3 sm:px-4 py-1.5 rounded-full">
                    <Calendar size={11} className="text-emerald-400" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">{nombreMes}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">{items.length} concepto{items.length !== 1 ? 's' : ''}</span>
                </div>
                {abierto
                  ? <ChevronUp size={15} className="text-slate-300 flex-shrink-0" />
                  : <ChevronDown size={15} className="text-slate-300 flex-shrink-0" />
                }
              </button>

              {abierto && (
                <div className="border-t border-slate-100 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map(h => (
                    <div key={h.id} className="border border-slate-100 p-4 sm:p-5 rounded-2xl flex flex-col gap-4 hover:border-emerald-200 hover:shadow-md transition-all group">

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors flex-shrink-0">
                            <History size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-tight leading-tight truncate">
                              {h.concepto_nombre}
                            </h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              {h.total_residentes} unidades
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => verDetalles(h)}
                            className="p-2 sm:p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                            title="Ver detalles"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("¿Borrar esta causación?")) {
                                await supabase.from("causaciones_globales").delete().eq("id", h.id);
                                cargarDatos();
                              }
                            }}
                            className="p-2 sm:p-2.5 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <span className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest">Regla:</span>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-0.5">
                          {['M1', 'M2', 'NORMAL'].map(m => {
                            const active = (h.tipo_cobro || 'NORMAL') === m;
                            const label = m === 'NORMAL' ? 'Automático' : m === 'M1' ? 'Con Descuento' : 'Sin Descuento';
                            return (
                              <button
                                key={m}
                                onClick={() => cambiarModo(h.id, m)}
                                className={`px-2 sm:px-3 py-1 rounded-lg text-[8px] sm:text-[9px] font-black transition-all ${active ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
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
            <CheckCircle2 className="mx-auto text-slate-200 mb-3" size={36} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sin causaciones registradas</p>
          </div>
        )}
      </div>

      {/* ── MODAL DE AUDITORÍA ───────────────────────────────── */}
      {showDetalles && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[500] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-4xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 border border-white/20 max-h-[90vh] sm:h-[85vh]">

            <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                  <LayoutGrid size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-sm sm:text-base">
                    Auditoría Detallada
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {causacionActiva?.concepto_nombre}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => imprimirAuditoria(causacionActiva, deudasDetalle, calcularValorDeudaHoy)}
                  className="p-2.5 bg-slate-900 text-white rounded-full shadow-sm hover:bg-emerald-600 transition-all flex items-center gap-2 px-4"
                  title="Imprimir auditoría"
                >
                  <Printer size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Imprimir</span>
                </button>
                <button
                  onClick={() => setShowDetalles(false)}
                  className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-rose-500 rounded-full shadow-sm transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="px-4 sm:px-8 py-3 sm:py-5 bg-white border-b border-slate-100 flex flex-col gap-3 flex-shrink-0">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={15} />
                <input
                  placeholder="Buscar por unidad o nombre..."
                  className="w-full bg-slate-50 border border-slate-100 p-3 sm:p-4 pl-11 rounded-2xl text-xs font-bold outline-none focus:bg-white transition-all shadow-inner"
                  onChange={(e) => setBusquedaDetalle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-emerald-50 border border-emerald-100 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl">
                  <p className="text-[7px] sm:text-[8px] font-black text-emerald-600 uppercase tracking-widest">Recaudado</p>
                  <span className="font-black text-emerald-700 text-base sm:text-lg tabular-nums">
                    ${deudasDetalle.reduce((acc, d) => acc + (Number(d.monto_original) - Number(d.saldo_pendiente)), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-rose-50 border border-rose-100 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl">
                  <p className="text-[7px] sm:text-[8px] font-black text-rose-600 uppercase tracking-widest">Por Cobrar</p>
                  <span className="font-black text-rose-700 text-base sm:text-lg tabular-nums">
                    ${deudasDetalle.reduce((acc, d) => acc + Number(d.saldo_pendiente), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2 bg-[#F8FAFC]">
              {loadingDetalle ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-20">
                  <Loader2 className="animate-spin mb-3" size={32} />
                  <p className="font-black uppercase text-xs tracking-widest">Cargando...</p>
                </div>
              ) : deudasFiltradas.map(d => {
                const pagado = Number(d.saldo_pendiente) === 0;
                return (
                  <div
                    key={d.id}
                    className={`bg-white border p-3 sm:p-5 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 transition-all shadow-sm hover:shadow-md ${pagado ? 'border-emerald-100 opacity-70' : 'border-slate-100 hover:border-emerald-200'}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                      <div className={`w-12 h-10 sm:w-14 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-[9px] sm:text-xs flex-shrink-0 ${pagado ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                        {d.unidad}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs sm:text-sm uppercase text-slate-800 tracking-tight truncate">
                          {d.residentes?.nombre}
                        </p>
                        <span className={`text-[7px] sm:text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-0.5 inline-block ${pagado ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                          {pagado ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm sm:text-lg font-black tabular-nums flex-shrink-0 ${pagado ? 'text-emerald-500' : 'text-rose-600'}`}>
                      ${(pagado ? Number(d.monto_original) : calcularValorDeudaHoy(d)).toLocaleString()}
                    </p>
                  </div>
                );
              })}
              {deudasFiltradas.length === 0 && !loadingDetalle && (
                <div className="py-16 text-center opacity-30 italic uppercase text-xs font-black tracking-[0.4em]">
                  Sin coincidencias
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 text-center border-t border-slate-100 flex-shrink-0">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
                Admin Pro - Parque de las Flores
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}