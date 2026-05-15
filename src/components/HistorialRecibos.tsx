"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, Printer, FileText, Loader2, Hash,
  ChevronDown, FolderOpen, Folder,
  Calendar, User, Trash2, AlertTriangle, X
} from "lucide-react";
import ReciboCaja from "./ReciboCaja";

// Orden de torres deseado
const ORDEN_TORRES = ["Torre 5", "Torre 6", "Torre 7", "Torre 8", "Torre 1"];

// Pisos del 1 al 6, 4 aptos por piso → columnas 01, 02, 03, 04
const COLUMNAS_APTO = ["01", "02", "03", "04"];
const PISOS = [1, 2, 3, 4, 5, 6];

export default function HistorialRecibos() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTorre, setFiltroTorre] = useState("TODAS");
  const [reciboSeleccionado, setReciboSeleccionado] = useState<any>(null);
  const [carpetasAbiertas, setCarpetasAbiertas] = useState<number[]>([]);

  // Estado para el modal de confirmación de eliminación
  const [pagoAEliminar, setPagoAEliminar] = useState<any>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => { cargarPagos(); }, []);

  async function cargarPagos() {
    setLoading(true);
    const { data } = await supabase
      .from("pagos")
      .select(`*, residentes (id, nombre, torre, apartamento, email)`)
      .order("created_at", { ascending: false });

    if (data) setPagos(data);
    setLoading(false);
  }

  const toggleCarpeta = (id: number) => {
    setCarpetasAbiertas(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // ── ELIMINACIÓN CON REVERSIÓN DE DEUDAS ──────────────────────────────────
  async function confirmarEliminar() {
    if (!pagoAEliminar) return;
    setEliminando(true);
    try {
      const p = pagoAEliminar;
      const residenteId = p.residente_id;

      // Parsear concepto_texto → array de { concepto, monto }
      // Formato: "NOMBRE_CONCEPTO|$1.000||NOMBRE_CONCEPTO2|$2.000"
      if (p.concepto_texto && residenteId) {
        const lineas = p.concepto_texto.split("||").filter(Boolean);
        for (const linea of lineas) {
          const partes = linea.split("|");
          if (partes.length < 2) continue;
          const conceptoNombre = partes[0].trim();
          const montoStr = partes[1].replace(/[^0-9,]/g, "").replace(",", ".");
          const monto = parseFloat(montoStr.replace(/\./g, "").replace(",", "."));
          if (!conceptoNombre || isNaN(monto) || monto <= 0) continue;

          // Buscar la deuda correspondiente (por residente + concepto nombre, saldo más bajo primero)
          const { data: deudas } = await supabase
            .from("deudas_residentes")
            .select("id, saldo_pendiente, monto_original")
            .eq("residente_id", residenteId)
            .eq("concepto_nombre", conceptoNombre)
            .order("saldo_pendiente", { ascending: true })
            .limit(1);

          if (deudas && deudas.length > 0) {
            const deuda = deudas[0];
            const nuevoSaldo = Number(deuda.saldo_pendiente) + monto;
            // El saldo no puede superar el monto original
            const saldoFinal = Math.min(nuevoSaldo, Number(deuda.monto_original));
            await supabase
              .from("deudas_residentes")
              .update({ saldo_pendiente: saldoFinal })
              .eq("id", deuda.id);
          } else {
            // Si la deuda no existe (fue borrada), crearla de nuevo como deuda pendiente
            await supabase.from("deudas_residentes").insert([{
              residente_id: residenteId,
              unidad: p.unidad,
              concepto_nombre: conceptoNombre,
              monto_original: monto,
              saldo_pendiente: monto,
              precio_m1: monto,
              precio_m2: monto,
              precio_m3: monto,
            }]);
          }
        }
      }

      // Eliminar el pago
      const { error } = await supabase.from("pagos").delete().eq("id", p.id);
      if (error) throw error;

      setPagos(prev => prev.filter(pp => pp.id !== p.id));
      setPagoAEliminar(null);
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setEliminando(false);
    }
  }

  // ── AGRUPACIÓN Y ORDENAMIENTO ─────────────────────────────────────────────
  const gruposFiltrados = useMemo(() => {
    const grupos: any = {};

    pagos.forEach(p => {
      const term = busqueda.toLowerCase().trim();
      const unidad = p.unidad?.toLowerCase() || "";
      const nombre = p.residentes?.nombre?.toLowerCase() || "";
      const recibo = p.numero_recibo?.toLowerCase() || "";
      const termNorm = term.replace("-", "");
      const unidadNorm = unidad.replace(/[^0-9]/g, "");
      const coincide =
        !term ||
        unidad.includes(term) ||
        nombre.includes(term) ||
        recibo.includes(term) ||
        (termNorm.length >= 3 && unidadNorm.includes(termNorm));

      const torreOk =
        filtroTorre === "TODAS" || p.residentes?.torre === filtroTorre;

      if (coincide && torreOk && p.residentes) {
        const idRes = p.residentes.id;
        if (!grupos[idRes]) {
          grupos[idRes] = {
            info: p.residentes,
            pagos: [],
            totalHistorico: 0,
          };
        }
        grupos[idRes].pagos.push(p);
        grupos[idRes].totalHistorico += Number(p.monto_total);
      }
    });

    // Ordenar por: torre (orden deseado) → apartamento numérico
    return Object.values(grupos).sort((a: any, b: any) => {
      const ia = ORDEN_TORRES.indexOf(a.info.torre);
      const ib = ORDEN_TORRES.indexOf(b.info.torre);
      const tA = ia === -1 ? 99 : ia;
      const tB = ib === -1 ? 99 : ib;
      if (tA !== tB) return tA - tB;
      return parseInt(a.info.apartamento) - parseInt(b.info.apartamento);
    });
  }, [pagos, busqueda, filtroTorre]);

  // Construir grilla: agrupar gruposFiltrados por torre
  const porTorre = useMemo(() => {
    const mapa: Record<string, any[]> = {};
    for (const torre of ORDEN_TORRES) mapa[torre] = [];
    (gruposFiltrados as any[]).forEach(g => {
      const t = g.info.torre;
      if (!mapa[t]) mapa[t] = [];
      mapa[t].push(g);
    });
    return mapa;
  }, [gruposFiltrados]);

  // Construir mapa para lookup rápido por torre+apto
  const mapaGrupo = useMemo(() => {
    const m: Record<string, any> = {};
    (gruposFiltrados as any[]).forEach(g => {
      const key = `${g.info.torre}__${g.info.apartamento}`;
      m[key] = g;
    });
    return m;
  }, [gruposFiltrados]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={30} />
      </div>
    );

  const torres = ORDEN_TORRES.filter(t => porTorre[t]?.length > 0 || filtroTorre === "TODAS");

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-4 font-sans text-slate-800">

      {/* ── CABECERA Y FILTROS ── */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-20 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Título */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-800">
                Archivo Digital
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Historial por Unidades
              </p>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar unidad, nombre o recibo..."
              className="w-full bg-slate-50 border border-slate-100 pl-9 pr-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold text-slate-700 text-xs"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* Filtros de torre */}
        <div className="flex gap-1.5 flex-wrap">
          {["TODAS", ...ORDEN_TORRES].map(t => (
            <button
              key={t}
              onClick={() => setFiltroTorre(t)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide transition-all ${filtroTorre === t
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
            >
              {t === "TODAS" ? "Todas" : t.replace("Torre ", "T-")}
            </button>
          ))}
        </div>
      </section>

      {/* ── GRILLA POR TORRE ── */}
      {gruposFiltrados.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <FolderOpen className="mx-auto text-slate-200 mb-2" size={40} />
          <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
            No se encontraron expedientes
          </p>
        </div>
      ) : (
        ORDEN_TORRES.map(torre => {
          const gruposTorre = porTorre[torre] || [];
          if (gruposTorre.length === 0) return null;

          return (
            <div key={torre} className="space-y-3">
              {/* Header de torre */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                  {torre}
                </div>
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {gruposTorre.length} unidades
                </span>
              </div>

              {/* Grilla 4 columnas: piso × columna */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PISOS.map(piso =>
                  COLUMNAS_APTO.map(col => {
                    const apto = `${piso}${col}`;
                    const key = `${torre}__${apto}`;
                    const grupo = mapaGrupo[key];

                    if (!grupo) {
                      // Celda vacía (apto sin pagos o sin residente)
                      return (
                        <div
                          key={`${piso}-${col}`}
                          className="h-14 bg-slate-50 border border-dashed border-slate-100 rounded-xl flex items-center justify-center"
                        >
                          <span className="text-[9px] font-bold text-slate-200 uppercase">
                            {apto}
                          </span>
                        </div>
                      );
                    }

                    const abierto = carpetasAbiertas.includes(grupo.info.id);
                    return (
                      <div
                        key={grupo.info.id}
                        className={`border rounded-xl overflow-hidden transition-all duration-200 ${abierto
                            ? "border-emerald-400 shadow-lg ring-1 ring-emerald-400/20 col-span-2 sm:col-span-4"
                            : "border-slate-200 hover:border-emerald-300"
                          }`}
                      >
                        {/* Cabecera de la carpeta */}
                        <button
                          onClick={() => toggleCarpeta(grupo.info.id)}
                          className={`w-full text-left transition-colors ${abierto
                              ? "bg-gradient-to-r from-emerald-50 to-white p-4"
                              : "bg-white p-3 hover:bg-slate-50"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${abierto
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-slate-100 text-slate-400"
                                  }`}
                              >
                                {abierto ? (
                                  <FolderOpen size={16} />
                                ) : (
                                  <Folder size={16} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 uppercase leading-tight truncate">
                                  {grupo.info.nombre}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 truncate">
                                  {grupo.pagos.length} recibo
                                  {grupo.pagos.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right hidden sm:block">
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                  Total
                                </p>
                                <p className="text-xs font-black text-emerald-600 tabular-nums">
                                  ${grupo.totalHistorico.toLocaleString("es-CO")}
                                </p>
                              </div>
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${abierto
                                    ? "rotate-180 text-emerald-500"
                                    : "text-slate-300"
                                  }`}
                              />
                            </div>
                          </div>

                          {/* Info extra cuando está abierto */}
                          {abierto && (
                            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <User size={10} /> {grupo.info.nombre}
                              </p>
                              <p className="text-[10px] font-black text-emerald-600 sm:hidden">
                                Total: ${grupo.totalHistorico.toLocaleString("es-CO")}
                              </p>
                            </div>
                          )}
                        </button>

                        {/* Contenido abierto: lista de recibos */}
                        {abierto && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-2">
                            {grupo.pagos.map((p: any) => (
                              <div
                                key={p.id}
                                className="bg-white border border-slate-100 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:shadow-md transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors border border-slate-100 shrink-0">
                                    <Hash size={14} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-slate-800">
                                      Recibo #{p.numero_recibo}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                      <Calendar size={9} /> {p.fecha_pago}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 justify-between sm:justify-end">
                                  <div className="text-right">
                                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">
                                      {p.metodo_pago}
                                    </p>
                                    <p className="text-sm font-black text-emerald-600 tabular-nums">
                                      ${Number(p.monto_total).toLocaleString("es-CO")}
                                    </p>
                                  </div>

                                  <div className="flex gap-1.5">
                                    {/* Botón ver recibo */}
                                    <button
                                      onClick={() => setReciboSeleccionado(p)}
                                      className="bg-white border border-slate-200 text-slate-400 p-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors shadow-sm"
                                      title="Ver Recibo"
                                    >
                                      <Printer size={14} />
                                    </button>

                                    {/* Botón eliminar */}
                                    <button
                                      onClick={() => setPagoAEliminar(p)}
                                      className="bg-white border border-red-100 text-red-300 p-2 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors shadow-sm"
                                      title="Eliminar Recibo"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })
      )}

      {/* ── MODAL CONFIRMACIÓN ELIMINAR ── */}
      {pagoAEliminar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  ¿Eliminar recibo #{pagoAEliminar.numero_recibo}?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Esta acción <strong>revertirá el pago</strong> y restaurará
                  la deuda de{" "}
                  <strong>
                    ${Number(pagoAEliminar.monto_total).toLocaleString("es-CO")}
                  </strong>{" "}
                  en el estado de cuenta del residente.
                </p>
              </div>
            </div>

            {/* Detalle del recibo */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-xs font-bold text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Unidad</span>
                <span>{pagoAEliminar.unidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha</span>
                <span>{pagoAEliminar.fecha_pago}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto</span>
                <span className="text-red-500">
                  -${Number(pagoAEliminar.monto_total).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Método</span>
                <span>{pagoAEliminar.metodo_pago}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPagoAEliminar(null)}
                disabled={eliminando}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X size={14} /> Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-black rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {eliminando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {eliminando ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL REIMPRESIÓN ── */}
      {reciboSeleccionado && (
        <ReciboCaja
          datos={{
            numero: reciboSeleccionado.numero_recibo,
            fecha: reciboSeleccionado.fecha_pago,
            nombre: reciboSeleccionado.residentes?.nombre || "N/A",
            unidad: reciboSeleccionado.unidad,
            valor: reciboSeleccionado.monto_total,
            concepto:
              reciboSeleccionado.concepto_texto || "GESTIÓN CARTERA (RESUMEN)",
            metodo: reciboSeleccionado.metodo_pago,
            comprobante: reciboSeleccionado.comprobante,
            saldoAnterior:
              reciboSeleccionado.saldo_anterior ||
              reciboSeleccionado.monto_total,
            email: reciboSeleccionado.residentes?.email,
          }}
          onClose={() => setReciboSeleccionado(null)}
        />
      )}
    </div>
  );
}