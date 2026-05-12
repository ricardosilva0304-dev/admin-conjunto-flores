"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import ReciboCaja from "./ReciboCaja";
import { calcularValorDeudaHoy, formatPeriodo, fechaColStr, mesColStr, hoyCol } from "@/lib/utils";
import {
  Search, Wallet, Loader2, X, Receipt,
  Calendar, ChevronRight, Hash, CreditCard,
  CheckCircle2, Plus, DollarSign, Clock,
  Trash2, AlertCircle, ChevronDown, Pencil
} from "lucide-react";

export default function Ingresos({ role }: { role?: string }) {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [datosRecibo, setDatosRecibo] = useState<any>(null);
  const [busqueda, setBusqueda] = useState("");
  const [resSeleccionado, setResSeleccionado] = useState<any>(null);

  const [formRecibo, setFormRecibo] = useState({
    numero: "",
    fecha: fechaColStr(),
    metodo: "Transferencia",
    referencia: "",
    fechaTransaccion: fechaColStr(),
  });
  const [abonos, setAbonos] = useState<{ [key: string]: string }>({});

  // ── CARGO MANUAL ──────────────────────────────────────────────────────────
  const [showManualModal, setShowManualModal] = useState(false);
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [formManual, setFormManual] = useState({
    concepto: "",
    mes: mesColStr(),
    valor: "",
  });

  // ── PAGO ANTICIPADO ───────────────────────────────────────────────────────
  const [showAnticipoModal, setShowAnticipoModal] = useState(false);
  const [guardandoAnticipo, setGuardandoAnticipo] = useState(false);
  const [conceptosPago, setConceptosPago] = useState<any[]>([]);
  const [anticiposActivos, setAnticimposActivos] = useState<any[]>([]);

  // Tipo de una línea en el carrito de anticipos
  type LineaAnticipo = {
    id: string; // key temporal
    concepto_id: string;
    mes: string;
    valorSugerido: number;
    valorPersonalizado: string; // string para el input, "" = usa sugerido
    editandoValor: boolean;
    valorM2: number;
    valorM3: number;
  };

  const [lineasAnticipo, setLineasAnticipo] = useState<LineaAnticipo[]>([]);
  const [formAnticipoBase, setFormAnticipoBase] = useState({
    metodo: "Transferencia",
    referencia: "",
    fechaRecibo: fechaColStr(),
    fechaTransaccion: fechaColStr(),
    numeroRecibo: "",
  });
  // Línea que se está configurando (selector añadir)
  const [nuevaLinea, setNuevaLinea] = useState({ concepto_id: "", mes: "" });

  const MESES_NOMBRES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  function mesLabel(mes: string) {
    if (!mes) return "";
    const [a, m] = mes.split("-");
    return `${MESES_NOMBRES[parseInt(m) - 1]} ${a}`;
  }

  function calcularValoresPorConcepto(concepto_id: string): { m1: number; m2: number; m3: number } {
    const c = conceptosPago.find(c => c.id === parseInt(concepto_id));
    if (!c || !resSeleccionado) return { m1: 0, m2: 0, m3: 0 };
    const escalar = (precio: number) => {
      if (!c.cobro_por_vehiculo) return precio;
      const n = c.nombre.toUpperCase();
      if (n.includes("CARRO")) return precio * (Number(resSeleccionado.carros) || 0);
      if (n.includes("MOTO")) return precio * (Number(resSeleccionado.motos) || 0);
      if (n.includes("BICI")) return precio * (Number(resSeleccionado.bicis) || 0);
      return 0;
    };
    return {
      m1: escalar(Number(c.monto_1_10) || 0),
      m2: escalar(Number(c.monto_11_20) || Number(c.monto_1_10) || 0),
      m3: escalar(Number(c.monto_21_adelante) || Number(c.monto_1_10) || 0),
    };
  }

  function agregarLineaAnticipo() {
    if (!nuevaLinea.concepto_id || !nuevaLinea.mes) return;
    // Evitar duplicado
    const existe = lineasAnticipo.find(
      l => l.concepto_id === nuevaLinea.concepto_id && l.mes === nuevaLinea.mes
    );
    if (existe) return alert(`⚠️ Ya agregaste ese concepto para ${mesLabel(nuevaLinea.mes)}.`);
    const vals = calcularValoresPorConcepto(nuevaLinea.concepto_id);
    const linea: LineaAnticipo = {
      id: `${nuevaLinea.concepto_id}-${nuevaLinea.mes}-${Date.now()}`,
      concepto_id: nuevaLinea.concepto_id,
      mes: nuevaLinea.mes,
      valorSugerido: vals.m1,
      valorPersonalizado: "",
      editandoValor: false,
      valorM2: vals.m2,
      valorM3: vals.m3,
    };
    setLineasAnticipo(prev => [...prev, linea]);
    setNuevaLinea({ concepto_id: "", mes: "" });
  }

  const getValorLinea = useCallback((l: LineaAnticipo): number => {
    const v = Number(l.valorPersonalizado);
    return v > 0 ? v : l.valorSugerido;
  }, []);

  const totalAnticipo = useMemo(
    () => lineasAnticipo.reduce((acc, l) => acc + getValorLinea(l), 0),
    [lineasAnticipo, getValorLinea]
  );

  function minMesAnticipo(): string {
    const d = hoyCol();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  async function cargarAnticimposActivos(resId: number) {
    const { data } = await supabase
      .from("deudas_residentes")
      .select("id, concepto_nombre, saldo_pendiente, fecha_vencimiento")
      .eq("residente_id", resId)
      .eq("estado", "ANTICIPO")
      .lt("saldo_pendiente", 0);
    setAnticimposActivos(data || []);
  }

  const [ultimoRecibo, setUltimoRecibo] = useState<{ numero: string; fecha: string; nombre: string; monto: number } | null>(null);

  async function cargarUltimoRecibo() {
    const { data } = await supabase
      .from("pagos")
      .select("numero_recibo, fecha_pago, monto_total, unidad")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setUltimoRecibo({
      numero: data.numero_recibo,
      fecha: data.fecha_pago,
      nombre: data.unidad,
      monto: data.monto_total,
    });
  }

  useEffect(() => {
    cargarResidentes(); cargarConceptos(); cargarUltimoRecibo();
    const canal = supabase.channel("ingresos-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "deudas_residentes" }, () => {
        if (resSeleccionado) cargarDeudasResidente(resSeleccionado);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "residentes" }, cargarResidentes)
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

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
    const { data, error } = await supabase.rpc("siguiente_numero_recibo");
    if (!error && data) return data as string;
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
    await cargarAnticimposActivos(res.id);
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
    if (role === 'contador') return alert("No tienes permiso para registrar cargos.");
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

  // ── ANTICIPO MULTI-LÍNEA + RECIBO DE CAJA ────────────────────────────────
  async function guardarAnticipo(e: React.FormEvent) {
    e.preventDefault();
    if (role === 'contador') return alert("No tienes permiso para registrar anticipos.");
    if (!resSeleccionado || lineasAnticipo.length === 0) return;
    if (totalAnticipo <= 0) return alert("El total a anticipar debe ser mayor a $0.");
    if (!formAnticipoBase.numeroRecibo) return alert("Ingresa el número de recibo.");

    // Validar que ninguna línea tenga valor 0
    for (const l of lineasAnticipo) {
      if (getValorLinea(l) <= 0) {
        const c = conceptosPago.find(c => c.id === parseInt(l.concepto_id));
        return alert(`⚠️ El valor de "${c?.nombre}" para ${mesLabel(l.mes)} no puede ser $0.`);
      }
    }

    // Validar duplicados en BD para cada línea
    const unidad = `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`;
    for (const l of lineasAnticipo) {
      const c = conceptosPago.find(c => c.id === parseInt(l.concepto_id));
      if (!c) continue;
      const nombreAnticipo = `ANTICIPO - ${c.nombre.trim().toUpperCase()} (${mesLabel(l.mes)})`;
      const { data: existente } = await supabase
        .from("deudas_residentes").select("id")
        .eq("residente_id", resSeleccionado.id)
        .eq("concepto_nombre", nombreAnticipo).maybeSingle();
      if (existente)
        return alert(`⚠️ Ya existe un anticipo de "${c.nombre}" para ${mesLabel(l.mes)}.`);
    }

    // Validar duplicado de recibo
    const { data: reciboExiste } = await supabase
      .from("pagos").select("numero_recibo")
      .eq("numero_recibo", formAnticipoBase.numeroRecibo).maybeSingle();
    if (reciboExiste) return alert("⚠️ Este número de recibo ya existe.");

    setGuardandoAnticipo(true);
    try {
      // 1 — Insertar una deuda-crédito por cada línea
      const conceptosTexto: string[] = [];
      for (const l of lineasAnticipo) {
        const c = conceptosPago.find(c => c.id === parseInt(l.concepto_id))!;
        const nombreAnticipo = `ANTICIPO - ${c.nombre.trim().toUpperCase()} (${mesLabel(l.mes)})`;
        const valorFinal = getValorLinea(l);
        const { error: errDeuda } = await supabase.from("deudas_residentes").insert([{
          residente_id: resSeleccionado.id,
          unidad,
          concepto_nombre: nombreAnticipo,
          monto_original: -valorFinal,
          saldo_pendiente: -valorFinal,
          precio_m1: valorFinal,
          precio_m2: l.valorM2,
          precio_m3: l.valorM3,
          fecha_vencimiento: `${l.mes}-01`,
          estado: "ANTICIPO",
        }]);
        if (errDeuda) throw errDeuda;
        conceptosTexto.push(`${nombreAnticipo}|$${valorFinal.toLocaleString("es-CO")}`);
      }

      // 2 — Registrar un único pago con todos los conceptos
      const conceptoTextoJoin = conceptosTexto.join("||");
      const { error: errPago } = await supabase.from("pagos").insert([{
        residente_id: resSeleccionado.id,
        unidad,
        numero_recibo: formAnticipoBase.numeroRecibo,
        monto_total: totalAnticipo,
        fecha_pago: formAnticipoBase.fechaRecibo || fechaColStr(),
        metodo_pago: formAnticipoBase.metodo,
        comprobante: formAnticipoBase.referencia.toUpperCase(),
        fecha_transaccion: formAnticipoBase.fechaTransaccion,
        concepto_texto: conceptoTextoJoin,
        saldo_anterior: totalDeudaAcumulada,
      }]);
      if (errPago) throw errPago;

      // 3 — Abrir ReciboCaja
      setDatosRecibo({
        numero: formAnticipoBase.numeroRecibo,
        fecha: formAnticipoBase.fechaRecibo || fechaColStr(),
        nombre: resSeleccionado.nombre,
        unidad,
        valor: totalAnticipo,
        concepto: conceptoTextoJoin,
        metodo: formAnticipoBase.metodo,
        comprobante: formAnticipoBase.referencia,
        fechaTransaccion: formAnticipoBase.fechaTransaccion,
        saldoAnterior: totalDeudaAcumulada,
        email: resSeleccionado.email,
      });

      setShowAnticipoModal(false);
      setLineasAnticipo([]);
      setNuevaLinea({ concepto_id: "", mes: "" });
      setFormAnticipoBase({
        metodo: "Transferencia", referencia: "",
        fechaRecibo: fechaColStr(),
        fechaTransaccion: fechaColStr(),
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
    if (role === 'contador') return alert("No tienes permiso para registrar pagos.");
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

      {/* ── ÚLTIMO RECIBO ─────────────────────────────────────── */}
      {ultimoRecibo && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Receipt size={14} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-0.5">Último recibo</p>
              <p className="text-xs font-black text-slate-700">N° {ultimoRecibo.numero}
                <span className="font-bold text-slate-400 ml-2">{ultimoRecibo.nombre}</span>
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-black text-emerald-600 tabular-nums">${ultimoRecibo.monto.toLocaleString("es-CO")}</p>
            <p className="text-[8px] font-bold text-slate-300">{ultimoRecibo.fecha}</p>
          </div>
        </div>
      )}

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
                      setFormAnticipoBase(prev => ({ ...prev, numeroRecibo: sig }));
                      setLineasAnticipo([]);
                      setNuevaLinea({ concepto_id: "", mes: "" });
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
            <div className="space-y-3">
              {/* Panel anticipos activos */}
              {anticiposActivos.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={12} className="text-amber-500" />
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                      Anticipos activos — se aplicarán en causación
                    </p>
                  </div>
                  <div className="space-y-2">
                    {anticiposActivos.map(a => {
                      const credito = Math.abs(Number(a.saldo_pendiente));
                      return (
                        <div key={a.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-amber-100">
                          <p className="text-[10px] font-bold text-slate-600 uppercase leading-tight flex-1 mr-2 break-words">
                            {a.concepto_nombre}
                          </p>
                          <span className="text-[10px] font-black text-amber-700 tabular-nums flex-shrink-0">
                            ${credito.toLocaleString("es-CO")} CR
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-amber-400 font-semibold mt-2.5 text-right">
                    Total crédito: ${anticiposActivos.reduce((acc, a) => acc + Math.abs(Number(a.saldo_pendiente)), 0).toLocaleString("es-CO")}
                  </p>
                </div>
              )}

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

      {/* ── MODAL PAGO ANTICIPADO (MULTI-LÍNEA) ─────────────────── */}
      {showAnticipoModal && resSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[95vh]">

            {/* Header */}
            <div className="bg-amber-50 px-5 py-4 border-b border-amber-100 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                  Pagos Anticipados
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                  {resSeleccionado.nombre} · T{resSeleccionado.torre.slice(-1)}-{resSeleccionado.apartamento}
                </p>
              </div>
              <button onClick={() => setShowAnticipoModal(false)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardarAnticipo} className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* ── AGREGAR LÍNEA ─────────────────────────────────── */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Plus size={10} /> Agregar concepto
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Concepto</label>
                    <select
                      className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-amber-400 appearance-none"
                      value={nuevaLinea.concepto_id}
                      onChange={e => setNuevaLinea(prev => ({ ...prev, concepto_id: e.target.value }))}
                    >
                      <option value="">Seleccionar...</option>
                      {conceptosPago.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mes futuro</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                      <input type="month"
                        className="w-full bg-white border border-slate-200 p-3 pl-8 rounded-xl font-bold text-sm outline-none focus:border-amber-400"
                        value={nuevaLinea.mes}
                        min={minMesAnticipo()}
                        onChange={e => setNuevaLinea(prev => ({ ...prev, mes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                {/* Preview del valor sugerido */}
                {nuevaLinea.concepto_id && nuevaLinea.mes && (() => {
                  const vals = calcularValoresPorConcepto(nuevaLinea.concepto_id);
                  return vals.m1 > 0 ? (
                    <div className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                      <span className="text-[9px] font-black text-amber-600 uppercase">Valor con descuento (días 1-10)</span>
                      <span className="text-sm font-black text-amber-700 tabular-nums">${vals.m1.toLocaleString("es-CO")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-rose-50 rounded-xl px-3 py-2 border border-rose-100">
                      <AlertCircle size={11} className="text-rose-400 flex-shrink-0" />
                      <span className="text-[9px] font-black text-rose-500 uppercase">Sin vehículos para este concepto</span>
                    </div>
                  );
                })()}
                <button type="button" onClick={agregarLineaAnticipo}
                  disabled={!nuevaLinea.concepto_id || !nuevaLinea.mes}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white font-black py-2.5 rounded-xl text-[9px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-1.5">
                  <Plus size={11} /> Agregar al recibo
                </button>
              </div>

              {/* ── CARRITO DE LÍNEAS ─────────────────────────────── */}
              {lineasAnticipo.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Conceptos en este recibo ({lineasAnticipo.length})
                  </p>
                  {lineasAnticipo.map((l, idx) => {
                    const c = conceptosPago.find(c => c.id === parseInt(l.concepto_id));
                    const valorFinal = getValorLinea(l);
                    const esPersonalizado = Number(l.valorPersonalizado) > 0;
                    return (
                      <div key={l.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                        {/* Número */}
                        <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-black mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-700 uppercase leading-tight break-words">
                            {c?.nombre}
                          </p>
                          <p className="text-[9px] text-amber-600 font-bold mt-0.5">{mesLabel(l.mes)}</p>

                          {/* Campo de valor personalizado */}
                          {l.editandoValor ? (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xs">$</span>
                                <input type="number" inputMode="numeric" autoFocus
                                  className="w-full bg-slate-50 border border-emerald-300 p-2 pl-6 rounded-lg text-sm font-black outline-none focus:border-emerald-500"
                                  placeholder={l.valorSugerido.toString()}
                                  value={l.valorPersonalizado}
                                  onChange={e => setLineasAnticipo(prev => prev.map(x =>
                                    x.id === l.id ? { ...x, valorPersonalizado: e.target.value } : x
                                  ))}
                                />
                              </div>
                              <button type="button"
                                onClick={() => setLineasAnticipo(prev => prev.map(x =>
                                  x.id === l.id ? { ...x, editandoValor: false } : x
                                ))}
                                className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap">
                                OK
                              </button>
                            </div>
                          ) : (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`text-sm font-black tabular-nums ${esPersonalizado ? "text-emerald-700" : "text-amber-700"}`}>
                                ${valorFinal.toLocaleString("es-CO")}
                              </span>
                              {esPersonalizado && (
                                <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  PERSONALIZADO · sugerido ${l.valorSugerido.toLocaleString("es-CO")}
                                </span>
                              )}
                              <button type="button"
                                onClick={() => setLineasAnticipo(prev => prev.map(x =>
                                  x.id === l.id ? { ...x, editandoValor: true } : x
                                ))}
                                className="ml-1 text-slate-300 hover:text-amber-500 transition-colors">
                                <Pencil size={10} />
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Eliminar */}
                        <button type="button"
                          onClick={() => setLineasAnticipo(prev => prev.filter(x => x.id !== l.id))}
                          className="text-slate-200 hover:text-rose-500 transition-colors flex-shrink-0 mt-0.5">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Subtotal */}
                  <div className="bg-amber-500 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-[9px] font-black text-amber-100 uppercase tracking-widest">Total anticipo</span>
                    <span className="text-lg font-black text-white tabular-nums">${totalAnticipo.toLocaleString("es-CO")}</span>
                  </div>
                </div>
              )}

              {/* ── DATOS DEL RECIBO ──────────────────────────────── */}
              {lineasAnticipo.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Datos del recibo</p>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha del Recibo</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                      <input type="date"
                        className="w-full bg-slate-50 border border-slate-100 p-3 pl-8 rounded-xl outline-none font-bold text-sm focus:bg-white"
                        value={formAnticipoBase.fechaRecibo}
                        onChange={e => setFormAnticipoBase(p => ({ ...p, fechaRecibo: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">N° de Recibo</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                      <input
                        className="w-full bg-slate-50 border border-slate-100 p-3 pl-8 rounded-xl outline-none font-black text-slate-900 text-sm"
                        value={formAnticipoBase.numeroRecibo}
                        onChange={e => setFormAnticipoBase(p => ({ ...p, numeroRecibo: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Medio de Pago</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      {["Transferencia", "Efectivo"].map(m => (
                        <button key={m} type="button"
                          onClick={() => setFormAnticipoBase(p => ({ ...p, metodo: m }))}
                          className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${formAnticipoBase.metodo === m ? "bg-white text-slate-900 shadow border" : "text-slate-400"}`}>
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Referencia</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none font-bold text-sm focus:bg-white"
                        placeholder="Ref bancaria..."
                        value={formAnticipoBase.referencia}
                        onChange={e => setFormAnticipoBase(p => ({ ...p, referencia: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fecha Consignación</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                        <input type="date"
                          className="w-full bg-slate-50 border border-slate-100 p-3 pl-8 rounded-xl outline-none font-bold text-sm focus:bg-white"
                          value={formAnticipoBase.fechaTransaccion}
                          onChange={e => setFormAnticipoBase(p => ({ ...p, fechaTransaccion: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={guardandoAnticipo || lineasAnticipo.length === 0}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-[0.15em] shadow-lg active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                    {guardandoAnticipo
                      ? <Loader2 className="animate-spin" size={15} />
                      : <><Clock size={13} /> REGISTRAR {lineasAnticipo.length > 1 ? `${lineasAnticipo.length} ANTICIPOS` : "ANTICIPO"} Y GENERAR RECIBO</>
                    }
                  </button>
                </div>
              )}

              {lineasAnticipo.length === 0 && (
                <div className="py-6 text-center">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock size={20} className="text-amber-300" />
                  </div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Agrega al menos un concepto para continuar
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}