"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import ReciboCaja from "./ReciboCaja";
import { calcularValorDeudaHoy, formatPeriodo } from "@/lib/utils";
import {
  Search, Wallet, Loader2, X, Receipt,
  Calendar, ChevronRight, Hash, CreditCard,
  CheckCircle2, Plus, DollarSign, Clock
} from "lucide-react";

export default function Ingresos() {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [datosRecibo, setDatosRecibo] = useState<any>(null);
  const [busqueda, setBusqueda] = useState("");
  const [resSeleccionado, setResSeleccionado] = useState<any>(null);

  const [formRecibo, setFormRecibo] = useState({
    numero: "",
    fecha: new Date().toISOString().split("T")[0],
    metodo: "Transferencia",
    referencia: "",
    fechaTransaccion: new Date().toISOString().split("T")[0],
  });
  const [abonos, setAbonos] = useState<{ [key: string]: string }>({});

  // ── CARGO MANUAL ──────────────────────────────────────────────────────────
  const [showManualModal, setShowManualModal] = useState(false);
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [formManual, setFormManual] = useState({
    concepto: "",
    mes: new Date().toISOString().split("-").slice(0, 2).join("-"),
    valor: "",
  });

  // ── PAGO ANTICIPADO ───────────────────────────────────────────────────────
  const [showAnticipoModal, setShowAnticipoModal] = useState(false);
  const [guardandoAnticipo, setGuardandoAnticipo] = useState(false);
  const [conceptosPago, setConceptosPago] = useState<any[]>([]);
  const [formAnticipo, setFormAnticipo] = useState({
    concepto_id: "",
    mes: "",
    metodo: "Transferencia",
    referencia: "",
    fechaTransaccion: new Date().toISOString().split("T")[0],
    numeroRecibo: "",
  });

  // Precio m1 (con descuento) — lo que el residente paga hoy
  const valorAnticipo = useMemo(() => {
    if (!formAnticipo.concepto_id || !resSeleccionado) return 0;
    const c = conceptosPago.find(c => c.id === parseInt(formAnticipo.concepto_id));
    if (!c) return 0;
    const precio = Number(c.monto_1_10) || 0;
    if (c.cobro_por_vehiculo) {
      const n = c.nombre.toUpperCase();
      if (n.includes("CARRO")) return precio * (Number(resSeleccionado.carros) || 0);
      if (n.includes("MOTO")) return precio * (Number(resSeleccionado.motos) || 0);
      if (n.includes("BICI")) return precio * (Number(resSeleccionado.bicis) || 0);
      return 0;
    }
    return precio;
  }, [formAnticipo.concepto_id, resSeleccionado, conceptosPago]);

  // Precios m2/m3 — se guardan en la deuda para que calcularValorDeudaHoy
  // escale correctamente si la diferencia queda pendiente después del día 10
  const valorAnticipoM2 = useMemo(() => {
    if (!formAnticipo.concepto_id || !resSeleccionado) return 0;
    const c = conceptosPago.find(c => c.id === parseInt(formAnticipo.concepto_id));
    if (!c) return 0;
    const precio = Number(c.monto_11_20) || Number(c.monto_1_10) || 0;
    if (c.cobro_por_vehiculo) {
      const n = c.nombre.toUpperCase();
      if (n.includes("CARRO")) return precio * (Number(resSeleccionado.carros) || 0);
      if (n.includes("MOTO")) return precio * (Number(resSeleccionado.motos) || 0);
      if (n.includes("BICI")) return precio * (Number(resSeleccionado.bicis) || 0);
      return 0;
    }
    return precio;
  }, [formAnticipo.concepto_id, resSeleccionado, conceptosPago]);

  const valorAnticipoM3 = useMemo(() => {
    if (!formAnticipo.concepto_id || !resSeleccionado) return 0;
    const c = conceptosPago.find(c => c.id === parseInt(formAnticipo.concepto_id));
    if (!c) return 0;
    const precio = Number(c.monto_21_adelante) || Number(c.monto_1_10) || 0;
    if (c.cobro_por_vehiculo) {
      const n = c.nombre.toUpperCase();
      if (n.includes("CARRO")) return precio * (Number(resSeleccionado.carros) || 0);
      if (n.includes("MOTO")) return precio * (Number(resSeleccionado.motos) || 0);
      if (n.includes("BICI")) return precio * (Number(resSeleccionado.bicis) || 0);
      return 0;
    }
    return precio;
  }, [formAnticipo.concepto_id, resSeleccionado, conceptosPago]);

  const mesAnticipoLabel = useMemo(() => {
    if (!formAnticipo.mes) return "";
    const [a, m] = formAnticipo.mes.split("-");
    const n = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    return `${n[parseInt(m) - 1]} ${a}`;
  }, [formAnticipo.mes]);

  useEffect(() => { cargarResidentes(); cargarConceptos(); }, []);

  async function cargarConceptos() {
    const { data } = await supabase.from("conceptos_pago").select("*");
    if (data) setConceptosPago(data);
  }

  async function cargarResidentes() {
    const { data } = await supabase
      .from("residentes").select("*").order("torre", { ascending: true });
    if (data) setResidentes(data);
    setLoading(false);
  }

  async function sugerirSiguienteRecibo(): Promise<string> {
    const { data } = await supabase
      .from("pagos").select("numero_recibo")
      .order("created_at", { ascending: false }).limit(20);
    if (data && data.length > 0) {
      const nums = data.map(p => parseInt(p.numero_recibo.replace(/\D/g, "")) || 0);
      return (Math.max(...nums) + 1).toString();
    }
    return "1";
  }

  async function cargarDeudasResidente(res: any) {
    setResSeleccionado(res);
    setBusqueda("");
    const { data } = await supabase
      .from("deudas_residentes")
      .select(`*, causaciones_globales(id, mes_causado, concepto_nombre, tipo_cobro)`)
      .eq("residente_id", res.id)
      .gt("saldo_pendiente", 0);

    if (data) {
      const ordenadas = data.sort((a: any, b: any) => {
        const fA = a.causaciones_globales?.mes_causado || a.fecha_vencimiento?.substring(0, 7) || "0000-00";
        const fB = b.causaciones_globales?.mes_causado || b.fecha_vencimiento?.substring(0, 7) || "0000-00";
        if (fB !== fA) return fB.localeCompare(fA);
        return (!a.causaciones_globales ? 1 : 0) - (!b.causaciones_globales ? 1 : 0);
      });
      setDeudas(ordenadas);
      const init: any = {};
      ordenadas.forEach((d: any) => (init[d.id] = ""));
      setAbonos(init);
    }
    const sig = await sugerirSiguienteRecibo();
    setFormRecibo(prev => ({ ...prev, numero: sig }));
  }

  const totalDeudaAcumulada = useMemo(
    () => deudas.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0),
    [deudas]
  );
  const totalAPagarRecibo = Object.values(abonos)
    .reduce((acc, val) => acc + (Number(val) || 0), 0);

  // ── CARGO MANUAL ──────────────────────────────────────────────────────────
  async function guardarCargoManual(e: React.FormEvent) {
    e.preventDefault();
    if (!resSeleccionado || !formManual.valor || !formManual.concepto) return;
    setGuardandoManual(true);
    const [a, m] = formManual.mes.split("-");
    const nn = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO",
      "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const monto = parseFloat(formManual.valor);
    const { error } = await supabase.from("deudas_residentes").insert([{
      residente_id: resSeleccionado.id,
      unidad: `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`,
      concepto_nombre: `${formManual.concepto.toUpperCase()} (${nn[parseInt(m) - 1]} ${a})`,
      monto_original: monto, saldo_pendiente: monto,
      precio_m1: monto, precio_m2: monto, precio_m3: monto,
      fecha_vencimiento: `${formManual.mes}-01`,
    }]);
    if (!error) {
      setShowManualModal(false);
      setFormManual({ concepto: "", mes: formManual.mes, valor: "" });
      await cargarDeudasResidente(resSeleccionado);
    } else alert("Error: " + error.message);
    setGuardandoManual(false);
  }

  // ── ANTICIPO + RECIBO DE CAJA ─────────────────────────────────────────────
  async function guardarAnticipo(e: React.FormEvent) {
    e.preventDefault();
    if (!resSeleccionado || !formAnticipo.concepto_id || !formAnticipo.mes) return;
    if (valorAnticipo <= 0)
      return alert("Sin vehículos registrados para este concepto.");
    if (!formAnticipo.numeroRecibo)
      return alert("Ingresa el número de recibo.");

    const concepto = conceptosPago.find(c => c.id === parseInt(formAnticipo.concepto_id));
    if (!concepto) return;

    const nombreAnticipo =
      `ANTICIPO - ${concepto.nombre.trim().toUpperCase()} (${mesAnticipoLabel})`;

    // Duplicado anticipo
    const { data: existente } = await supabase
      .from("deudas_residentes").select("id")
      .eq("residente_id", resSeleccionado.id)
      .eq("concepto_nombre", nombreAnticipo).maybeSingle();
    if (existente)
      return alert(`⚠️ Ya existe un anticipo de "${concepto.nombre}" para ${mesAnticipoLabel}.`);

    // Duplicado recibo
    const { data: reciboExiste } = await supabase
      .from("pagos").select("numero_recibo")
      .eq("numero_recibo", formAnticipo.numeroRecibo).maybeSingle();
    if (reciboExiste)
      return alert("⚠️ Este número de recibo ya existe.");

    setGuardandoAnticipo(true);
    try {
      const unidad = `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`;

      // 1 — Guardar crédito en deudas_residentes (saldo NEGATIVO)
      //     precio_m1 = lo que pagó (con descuento)
      //     precio_m2/m3 = escalas completas del concepto, para que si queda diferencia
      //     pendiente después de la causación, calcularValorDeudaHoy la escale bien
      const { error: errDeuda } = await supabase.from("deudas_residentes").insert([{
        residente_id: resSeleccionado.id,
        unidad,
        concepto_nombre: nombreAnticipo,
        monto_original: -valorAnticipo,
        saldo_pendiente: -valorAnticipo,  // negativo = crédito
        precio_m1: valorAnticipo,
        precio_m2: valorAnticipoM2,
        precio_m3: valorAnticipoM3,
        fecha_vencimiento: `${formAnticipo.mes}-01`,
        estado: "ANTICIPO",
      }]);
      if (errDeuda) throw errDeuda;

      // 2 — Registrar pago en tabla pagos
      const conceptoTexto = `${nombreAnticipo}|$${valorAnticipo.toLocaleString("es-CO")}`;
      const { error: errPago } = await supabase.from("pagos").insert([{
        residente_id: resSeleccionado.id,
        unidad,
        numero_recibo: formAnticipo.numeroRecibo,
        monto_total: valorAnticipo,
        fecha_pago: new Date().toISOString().split("T")[0],
        metodo_pago: formAnticipo.metodo,
        comprobante: formAnticipo.referencia.toUpperCase(),
        fecha_transaccion: formAnticipo.fechaTransaccion,
        concepto_texto: conceptoTexto,
        saldo_anterior: totalDeudaAcumulada,
      }]);
      if (errPago) throw errPago;

      // 3 — Abrir ReciboCaja
      setDatosRecibo({
        numero: formAnticipo.numeroRecibo,
        fecha: new Date().toISOString().split("T")[0],
        nombre: resSeleccionado.nombre,
        unidad,
        valor: valorAnticipo,
        concepto: conceptoTexto,
        metodo: formAnticipo.metodo,
        comprobante: formAnticipo.referencia,
        fechaTransaccion: formAnticipo.fechaTransaccion,
        saldoAnterior: totalDeudaAcumulada,
        email: resSeleccionado.email,
      });

      setShowAnticipoModal(false);
      setFormAnticipo({
        concepto_id: "", mes: "",
        metodo: "Transferencia", referencia: "",
        fechaTransaccion: new Date().toISOString().split("T")[0],
        numeroRecibo: "",
      });
      setResSeleccionado(null);
      setDeudas([]);
    } catch (err: any) {
      alert("Error al guardar anticipo: " + err.message);
    } finally {
      setGuardandoAnticipo(false);
    }
  }

  // ── PAGO NORMAL ───────────────────────────────────────────────────────────
  async function procesarPago() {
    if (totalAPagarRecibo <= 0 || !formRecibo.numero)
      return alert("Verifica montos y número de recibo.");
    setProcesando(true);
    try {
      const { data: existe } = await supabase.from("pagos").select("numero_recibo")
        .eq("numero_recibo", formRecibo.numero).maybeSingle();
      if (existe) {
        alert("⚠️ Este número de recibo ya existe.");
        const sig = await sugerirSiguienteRecibo();
        setFormRecibo(prev => ({ ...prev, numero: sig }));
        return;
      }

      const saldoPrevio = totalDeudaAcumulada;
      const conceptoTextoParaDB = deudas
        .filter(d => Number(abonos[d.id]) > 0)
        .map(d => {
          const nombre = d.causaciones_globales?.concepto_nombre || d.concepto_nombre;
          return `${nombre}|$${Number(abonos[d.id]).toLocaleString("es-CO")}`;
        }).join("||");

      const { error: errP } = await supabase.from("pagos").insert([{
        residente_id: resSeleccionado.id,
        unidad: `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`,
        numero_recibo: formRecibo.numero,
        monto_total: totalAPagarRecibo,
        fecha_pago: formRecibo.fecha,
        metodo_pago: formRecibo.metodo,
        comprobante: formRecibo.referencia.toUpperCase(),
        fecha_transaccion: formRecibo.fechaTransaccion,
        concepto_texto: conceptoTextoParaDB,
        saldo_anterior: saldoPrevio,
      }]);
      if (errP) throw errP;

      for (const [dId, montoAbono] of Object.entries(abonos)) {
        if (Number(montoAbono) > 0) {
          const orig = deudas.find(d => d.id === Number(dId));
          const nuevoSaldo = (Number(orig.saldo_pendiente) || 0) - Number(montoAbono);
          await supabase.from("deudas_residentes")
            .update({ saldo_pendiente: nuevoSaldo }).eq("id", dId);
        }
      }

      setDatosRecibo({
        numero: formRecibo.numero,
        fecha: formRecibo.fecha,
        nombre: resSeleccionado.nombre,
        unidad: `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`,
        valor: totalAPagarRecibo,
        concepto: conceptoTextoParaDB,
        metodo: formRecibo.metodo,
        comprobante: formRecibo.referencia,
        fechaTransaccion: formRecibo.fechaTransaccion,
        saldoAnterior: saldoPrevio,
        email: resSeleccionado.email,
      });
      setResSeleccionado(null);
      setDeudas([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcesando(false);
    }
  }

  const filteredRes = busqueda.length > 0
    ? residentes.filter(r => {
      const t = busqueda.toLowerCase().replace(/[-\s]/g, "");
      const u = `${r.torre.replace("Torre ", "")}${r.apartamento}`;
      return r.nombre.toLowerCase().includes(t) || u.includes(t);
    }).slice(0, 4)
    : [];

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={32} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-24 px-3 sm:px-4 md:px-6 lg:px-0 font-sans text-slate-800">
      {datosRecibo && <ReciboCaja datos={datosRecibo} onClose={() => setDatosRecibo(null)} />}

      {/* ── BUSCADOR ─────────────────────────────────────────────── */}
      <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm relative z-[40]">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
          Unidad Responsable del Pago
        </label>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={17} />
          <input
            className="w-full bg-slate-50/50 border border-slate-100 pl-12 pr-12 py-4 rounded-xl outline-none font-bold text-slate-700 text-sm focus:bg-white focus:ring-4 ring-emerald-500/5 transition-all placeholder:text-slate-300"
            placeholder="Nombre o Unidad (ej: 1101)"
            value={resSeleccionado
              ? `${resSeleccionado.nombre} | T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`
              : busqueda}
            onChange={e => { setBusqueda(e.target.value); setResSeleccionado(null); }}
          />
          {(busqueda || resSeleccionado) && (
            <button
              onClick={() => { setBusqueda(""); setResSeleccionado(null); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 p-1.5 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {filteredRes.length > 0 && (
          <div className="absolute top-[calc(100%-6px)] left-3 right-3 sm:left-6 sm:right-6 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2">
              {filteredRes.map(r => (
                <button key={r.id} onClick={() => cargarDeudasResidente(r)}
                  className="w-full p-3 mb-0.5 text-left rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      T{r.torre.slice(-1)}
                    </div>
                    <span className="font-black text-xs text-slate-800 uppercase truncate group-hover:text-emerald-700 transition-colors">
                      {r.nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-black group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      {r.apartamento}
                    </span>
                    <ChevronRight size={14} className="text-slate-200 group-hover:text-emerald-500 transition-all" />
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em]">Selecciona una unidad</p>
            </div>
          </div>
        )}
      </section>

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────── */}
      {resSeleccionado && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 animate-in slide-in-from-bottom-2 duration-500">

          {/* ── COLUMNA IZQUIERDA ── */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

              {/* Header */}
              <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Receipt size={12} /> Obligaciones
                  </span>
                  <button onClick={() => setShowManualModal(true)}
                    className="bg-slate-900 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all active:scale-95">
                    <Plus size={10} /> Cargo Extra
                  </button>
                  <button
                    onClick={async () => {
                      const sig = await sugerirSiguienteRecibo();
                      setFormAnticipo(prev => ({ ...prev, numeroRecibo: sig, concepto_id: "", mes: "" }));
                      setShowAnticipoModal(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all active:scale-95">
                    <Clock size={10} /> Anticipo
                  </button>
                </div>
                <span className={`text-[10px] font-black ${totalDeudaAcumulada < 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  TOTAL: ${Math.abs(totalDeudaAcumulada).toLocaleString("es-CO")}
                  {totalDeudaAcumulada < 0 ? " CR" : ""}
                </span>
              </div>

              {/* Filas */}
              {deudas.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center gap-3">
                  <div className="w-13 h-13 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={26} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Unidad al día</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin deudas pendientes.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {deudas.map(d => {
                    const sHoy = calcularValorDeudaHoy(d);
                    return (
                      <div key={d.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-700 uppercase leading-tight break-words">
                            {d.causaciones_globales?.concepto_nombre || d.concepto_nombre}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                            {formatPeriodo(d)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                          <div className="text-left sm:text-right">
                            <p className="text-[8px] font-black text-slate-300 uppercase leading-none mb-0.5">Saldo</p>
                            <p className="font-black text-sm tabular-nums">${sHoy.toLocaleString()}</p>
                          </div>
                          <div className="relative w-28 sm:w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xs">$</span>
                            <input type="number" inputMode="numeric"
                              className="w-full bg-white border border-slate-200 p-2.5 pl-7 rounded-xl text-right font-black text-sm outline-none focus:border-emerald-500 shadow-inner"
                              value={abonos[d.id] || ""}
                              onChange={e => setAbonos({ ...abonos, [d.id]: e.target.value })}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totales */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-600 p-4 sm:p-5 rounded-2xl text-white shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-[9px] font-black uppercase tracking-widest mb-1">Total a Recibir</p>
                  <h4 className="text-xl sm:text-2xl font-black tabular-nums">${totalAPagarRecibo.toLocaleString()}</h4>
                </div>
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wallet size={17} />
                </div>
              </div>
              <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Saldo Estimado</p>
                  <h4 className="text-xl sm:text-2xl font-black tabular-nums opacity-60">
                    ${Math.abs(totalDeudaAcumulada - totalAPagarRecibo).toLocaleString()}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* ── COLUMNA DERECHA — Caja ── */}
          <div className="lg:col-span-4">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 lg:sticky lg:top-6">
              <div className="flex items-center gap-2.5 border-b pb-3">
                <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 flex-shrink-0">
                  <CreditCard size={14} />
                </div>
                <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">Trámite de Caja</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha del Recibo</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                    <input type="date"
                      className="w-full bg-slate-50 border border-slate-100 p-3 pl-10 rounded-xl outline-none font-bold text-sm focus:bg-white"
                      value={formRecibo.fecha}
                      onChange={e => setFormRecibo({ ...formRecibo, fecha: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">N° de Recibo</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                    <input
                      className="w-full bg-slate-50 border border-slate-100 p-3 pl-10 rounded-xl outline-none font-black text-slate-900 text-sm"
                      value={formRecibo.numero}
                      onChange={e => setFormRecibo({ ...formRecibo, numero: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Medio de Pago</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    {["Transferencia", "Efectivo"].map(m => (
                      <button key={m} onClick={() => setFormRecibo({ ...formRecibo, metodo: m })}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${formRecibo.metodo === m ? "bg-white text-slate-900 shadow border" : "text-slate-400"}`}>
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Referencia</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none font-bold text-sm focus:bg-white"
                    placeholder="Ref bancaria..."
                    value={formRecibo.referencia}
                    onChange={e => setFormRecibo({ ...formRecibo, referencia: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha Consignación</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                    <input type="date"
                      className="w-full bg-slate-50 border border-slate-100 p-3 pl-10 rounded-xl outline-none font-bold text-sm focus:bg-white"
                      value={formRecibo.fechaTransaccion}
                      onChange={e => setFormRecibo({ ...formRecibo, fechaTransaccion: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button onClick={procesarPago} disabled={procesando || totalAPagarRecibo <= 0}
                className="w-full bg-emerald-600 text-white font-black py-4 sm:py-5 rounded-xl shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2">
                {procesando ? <Loader2 className="animate-spin" size={16} /> : "PROCESAR Y GUARDAR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CARGO MANUAL ───────────────────────────────────── */}
      {showManualModal && resSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  Cargo Extraordinario
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                  T{resSeleccionado.torre.slice(-1)}-{resSeleccionado.apartamento} · {resSeleccionado.nombre}
                </p>
              </div>
              <button onClick={() => setShowManualModal(false)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={guardarCargoManual} className="p-5 space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Descripción del Cargo</label>
                <input
                  className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl outline-none font-bold text-sm uppercase focus:bg-white placeholder:text-slate-300"
                  placeholder="EJ: MULTA, DAÑO, SALÓN..."
                  value={formManual.concepto}
                  onChange={e => setFormManual({ ...formManual, concepto: e.target.value })}
                  required autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Periodo</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <input type="month"
                      className="w-full bg-slate-50 border border-slate-100 p-3 pl-8 rounded-xl font-bold text-xs outline-none focus:bg-white"
                      value={formManual.mes}
                      onChange={e => setFormManual({ ...formManual, mes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">Valor</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300" size={12} />
                    <input type="number" inputMode="numeric"
                      className="w-full bg-rose-50 border border-rose-100 p-3 pl-8 rounded-xl font-black text-sm text-rose-600 outline-none"
                      placeholder="0" value={formManual.valor}
                      onChange={e => setFormManual({ ...formManual, valor: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={guardandoManual}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-[0.15em] hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {guardandoManual ? <Loader2 className="animate-spin" size={15} /> : <>AGREGAR Y RECARGAR <ChevronRight size={13} /></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL PAGO ANTICIPADO ─────────────────────────────────── */}
      {showAnticipoModal && resSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[95vh]">

            {/* Header */}
            <div className="bg-amber-50 px-5 py-4 border-b border-amber-100 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                  Pago Anticipado
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                  {resSeleccionado.nombre} · T{resSeleccionado.torre.slice(-1)}-{resSeleccionado.apartamento}
                </p>
              </div>
              <button onClick={() => setShowAnticipoModal(false)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarAnticipo} className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Concepto + Mes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Concepto</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-sm outline-none focus:bg-white appearance-none"
                    value={formAnticipo.concepto_id}
                    onChange={e => setFormAnticipo({ ...formAnticipo, concepto_id: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {conceptosPago.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mes Futuro</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <input type="month"
                      className="w-full bg-slate-50 border border-slate-100 p-3 pl-8 rounded-xl font-bold text-sm outline-none focus:bg-white"
                      value={formAnticipo.mes}
                      min={new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 7)}
                      onChange={e => setFormAnticipo({ ...formAnticipo, mes: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Preview valor */}
              {formAnticipo.concepto_id && formAnticipo.mes && (
                <div className={`rounded-xl p-4 border ${valorAnticipo > 0 ? "bg-amber-50 border-amber-100" : "bg-rose-50 border-rose-100"}`}>
                  {valorAnticipo > 0 ? (
                    <>
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">
                        Valor con descuento — días 1 al 10
                      </p>
                      <p className="text-2xl font-black text-amber-700 tabular-nums">
                        ${valorAnticipo.toLocaleString("es-CO")}
                      </p>
                      <p className="text-[10px] text-amber-500 font-semibold mt-1">
                        {mesAnticipoLabel} · Se aplica al generar la causación
                      </p>
                    </>
                  ) : (
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                      Sin vehículos para este concepto
                    </p>
                  )}
                </div>
              )}

              {/* Datos del recibo */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Datos del Recibo</p>

                {/* N° recibo */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">N° de Recibo</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <input
                      className="w-full bg-slate-50 border border-slate-100 p-3 pl-8 rounded-xl outline-none font-black text-slate-900 text-sm"
                      value={formAnticipo.numeroRecibo}
                      onChange={e => setFormAnticipo({ ...formAnticipo, numeroRecibo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Medio de pago */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Medio de Pago</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    {["Transferencia", "Efectivo"].map(m => (
                      <button key={m} type="button"
                        onClick={() => setFormAnticipo({ ...formAnticipo, metodo: m })}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${formAnticipo.metodo === m ? "bg-white text-slate-900 shadow border" : "text-slate-400"}`}>
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Referencia + Fecha consignación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Referencia</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none font-bold text-sm focus:bg-white"
                      placeholder="Ref bancaria..."
                      value={formAnticipo.referencia}
                      onChange={e => setFormAnticipo({ ...formAnticipo, referencia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha Consignación</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                      <input type="date"
                        className="w-full bg-slate-50 border border-slate-100 p-3 pl-8 rounded-xl outline-none font-bold text-sm focus:bg-white"
                        value={formAnticipo.fechaTransaccion}
                        onChange={e => setFormAnticipo({ ...formAnticipo, fechaTransaccion: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={guardandoAnticipo || valorAnticipo <= 0}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-[0.15em] shadow-lg active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                {guardandoAnticipo
                  ? <Loader2 className="animate-spin" size={15} />
                  : <><Clock size={13} /> REGISTRAR Y GENERAR RECIBO</>
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}