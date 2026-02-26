"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import ReciboCaja from "./ReciboCaja";
import { calcularValorDeudaHoy, formatPeriodo } from "@/lib/utils";
import {
  Search, Wallet, Loader2, X, Receipt,
  Calendar, ChevronRight, Hash, CreditCard,
  CheckCircle2, Plus, DollarSign
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
    fecha: new Date().toISOString().split('T')[0],
    metodo: "Transferencia",
    referencia: "",
    fechaTransaccion: new Date().toISOString().split('T')[0] // <-- NUEVO CAMPO
  });

  const [abonos, setAbonos] = useState<{ [key: string]: string }>({});
  const [showManualModal, setShowManualModal] = useState(false);
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [formManual, setFormManual] = useState({
    concepto: "",
    mes: new Date().toISOString().split('-').slice(0, 2).join('-'),
    valor: ""
  });

  useEffect(() => { cargarResidentes(); }, []);

  async function cargarResidentes() {
    const { data } = await supabase.from("residentes").select("*").order('torre', { ascending: true });
    if (data) setResidentes(data);
    setLoading(false);
  }

  async function sugerirSiguienteRecibo() {
    const { data } = await supabase.from("pagos").select("numero_recibo").order("created_at", { ascending: false }).limit(20);
    if (data && data.length > 0) {
      const numeros = data.map(p => parseInt(p.numero_recibo.replace(/\D/g, "")) || 0);
      setFormRecibo(prev => ({ ...prev, numero: (Math.max(...numeros) + 1).toString() }));
    } else {
      setFormRecibo(prev => ({ ...prev, numero: "1" }));
    }
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
      setDeudas(data);
      const initialAbonos: any = {};
      data.forEach((d: any) => initialAbonos[d.id] = "");
      setAbonos(initialAbonos);
    }
    await sugerirSiguienteRecibo();
  }

  const totalDeudaAcumulada = useMemo(() => {
    return deudas.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);
  }, [deudas]);

  const totalAPagarRecibo = Object.values(abonos).reduce((acc, val) => acc + (Number(val) || 0), 0);

  async function guardarCargoManual(e: React.FormEvent) {
    e.preventDefault();
    if (!resSeleccionado || !formManual.valor || !formManual.concepto) return;
    setGuardandoManual(true);

    const [anio, mesNum] = formManual.mes.split("-");
    const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const periodoTexto = `${mesesNombres[parseInt(mesNum) - 1]} ${anio}`;
    const conceptoFinal = `${formManual.concepto.toUpperCase()} (${periodoTexto})`;
    const monto = parseFloat(formManual.valor);

    const { error } = await supabase.from("deudas_residentes").insert([{
      residente_id: resSeleccionado.id,
      unidad: `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`,
      concepto_nombre: conceptoFinal,
      monto_original: monto,
      saldo_pendiente: monto,
      precio_m1: monto,
      precio_m2: monto,
      precio_m3: monto,
      fecha_vencimiento: `${formManual.mes}-01`
    }]);

    if (!error) {
      setShowManualModal(false);
      setFormManual({ concepto: "", mes: formManual.mes, valor: "" });
      // Recargamos las deudas del residente para que aparezca el nuevo cobro de inmediato
      await cargarDeudasResidente(resSeleccionado);
    } else {
      alert("Error al guardar cargo: " + error.message);
    }
    setGuardandoManual(false);
  }

  async function procesarPago() {
    if (totalAPagarRecibo <= 0 || !formRecibo.numero) return alert("Verifica montos y número de recibo.");
    setProcesando(true);

    try {
      const { data: existe } = await supabase.from("pagos").select("numero_recibo").eq("numero_recibo", formRecibo.numero).maybeSingle();
      if (existe) {
        alert("⚠️ Este número de recibo ya existe.");
        await sugerirSiguienteRecibo();
        setProcesando(false);
        return;
      }

      const saldoPrevio = totalDeudaAcumulada;

      const conceptoTextoParaDB = deudas
        .filter(d => Number(abonos[d.id]) > 0)
        .map(d => {
          const monto = Number(abonos[d.id]).toLocaleString('es-CO');
          const nombre = d.causaciones_globales?.concepto_nombre || d.concepto_nombre;
          return `${nombre}|$${monto}`;
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
        saldo_anterior: saldoPrevio
      }]);

      if (errP) throw errP;

      // Actualizar saldos en deudas_residentes
      for (const [dId, montoAbono] of Object.entries(abonos)) {
        if (Number(montoAbono) > 0) {
          const original = deudas.find(d => d.id === Number(dId));
          const nuevoSaldo = (Number(original.saldo_pendiente) || 0) - Number(montoAbono);
          await supabase.from("deudas_residentes").update({ saldo_pendiente: nuevoSaldo }).eq("id", dId);
        }
      }

      setDatosRecibo({
        numero: formRecibo.numero, fecha: formRecibo.fecha,
        nombre: resSeleccionado.nombre, unidad: `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`,
        valor: totalAPagarRecibo, concepto: conceptoTextoParaDB,
        metodo: formRecibo.metodo, comprobante: formRecibo.referencia,
        fechaTransaccion: formRecibo.fechaTransaccion,
        saldoAnterior: saldoPrevio, email: resSeleccionado.email
      });

      setResSeleccionado(null); setDeudas([]);
    } catch (e: any) { alert(e.message); }
    finally { setProcesando(false); }
  }

  const filteredRes = busqueda.length > 0 ? residentes.filter(r => {
    const term = busqueda.toLowerCase();
    const unidadId = `${r.torre.replace("Torre ", "")}-${r.apartamento}`;
    return r.nombre.toLowerCase().includes(term) || unidadId.includes(term);
  }).slice(0, 4) : [];

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans text-slate-800">
      {datosRecibo && <ReciboCaja datos={datosRecibo} onClose={() => setDatosRecibo(null)} />}

      {/* BUSCADOR ESTILO PREMIUM LIGHT */}
      <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative z-[40]">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 mb-1 block">
            Unidad Responsable del Pago
          </label>

          <div className="relative group">
            {/* Icono de búsqueda con efecto de foco */}
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors duration-300"
              size={20}
            />

            <input
              className="w-full bg-slate-50/50 border border-slate-100 pl-16 pr-14 py-5 rounded-[1.8rem] outline-none font-bold text-slate-700 text-base focus:bg-white focus:ring-4 ring-emerald-500/5 transition-all shadow-inner placeholder:text-slate-300"
              placeholder="Busca por Nombre o Unidad (ej: 7-302)"
              value={resSeleccionado ? `${resSeleccionado.nombre} | T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}` : busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setResSeleccionado(null); }}
            />

            {/* Botón de limpiar transparente */}
            {(busqueda || resSeleccionado) && (
              <button
                onClick={() => { setBusqueda(""); setResSeleccionado(null); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-all p-2 hover:bg-slate-100 rounded-2xl"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* DROP-DOWN DE RESULTADOS REDISEÑADO */}
        {filteredRes.length > 0 && (
          <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-100 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-3">
              {filteredRes.map(r => (
                <button
                  key={r.id}
                  onClick={() => cargarDeudasResidente(r)}
                  className="w-full p-4 mb-1 text-left rounded-2xl hover:bg-slate-50 flex items-center justify-between group transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-5">
                    {/* Avatar circular con inicial de torre */}
                    <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black text-xs border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all duration-300">
                      T{r.torre.slice(-1)}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-black text-sm text-slate-800 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">
                        {r.nombre}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Propiedad Horizontal
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Badge de Apartamento */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">Apartamento</span>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[11px] font-black group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                        {r.apartamento}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>

            {/* Pie del buscador sutil */}
            <div className="bg-slate-50/50 p-4 text-center border-t border-slate-100">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
                Selecciona una unidad para registrar pago
              </p>
            </div>
          </div>
        )}
      </section>

      {resSeleccionado && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-2 duration-500">

          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Receipt size={14} /> Obligaciones
                  </span>
                  {/* BOTÓN DE CARGO MANUAL RÁPIDO */}
                  <button
                    onClick={() => setShowManualModal(true)}
                    className="bg-slate-900 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all shadow-sm active:scale-95"
                  >
                    <Plus size={12} /> Cargo Extra
                  </button>
                </div>
                <span className={`text-[11px] font-black ${totalDeudaAcumulada < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  TOTAL: ${Math.abs(totalDeudaAcumulada).toLocaleString('es-CO')} {totalDeudaAcumulada < 0 ? '(CR)' : ''}
                </span>
              </div>

              {deudas.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Unidad al día</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No registra deudas pendientes.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {deudas.map(d => {
                    const sHoy = calcularValorDeudaHoy(d);
                    return (
                      <div key={d.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-slate-700 uppercase truncate">
                            {d.causaciones_globales?.concepto_nombre || d.concepto_nombre}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {formatPeriodo(d)}
                          </p>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[8px] font-black text-slate-300 uppercase leading-none mb-1">Saldo</p>
                            <p className="font-black text-sm tabular-nums">${sHoy.toLocaleString()}</p>
                          </div>
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xs">$</span>
                            <input
                              type="number"
                              className="w-full bg-white border border-slate-200 p-2.5 pl-7 rounded-xl text-right font-black text-sm outline-none focus:border-emerald-500 shadow-inner"
                              value={abonos[d.id] || ""}
                              onChange={(e) => setAbonos({ ...abonos, [d.id]: e.target.value })}
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

            {/* RESUMEN INFERIOR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-[9px] font-black uppercase tracking-widest mb-1">Total a Recibir</p>
                  <h4 className="text-3xl font-black tabular-nums">${totalAPagarRecibo.toLocaleString()}</h4>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Wallet size={24} /></div>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Nuevo Saldo Est.</p>
                  <h4 className="text-3xl font-black tabular-nums opacity-60">${Math.abs(totalDeudaAcumulada - totalAPagarRecibo).toLocaleString()}</h4>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: PANEL DE CAJA */}
          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 sticky top-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><CreditCard size={18} /></div>
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Trámite de Caja</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fecha del Recibo</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none font-bold text-sm focus:bg-white" value={formRecibo.fecha} onChange={(e) => setFormRecibo({ ...formRecibo, fecha: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">No. Comprobante RC</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none font-black text-slate-900" value={formRecibo.numero} onChange={(e) => setFormRecibo({ ...formRecibo, numero: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Medio de Pago</label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                    {['Transferencia', 'Efectivo'].map(m => (
                      <button key={m} onClick={() => setFormRecibo({ ...formRecibo, metodo: m })} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black transition-all ${formRecibo.metodo === m ? "bg-white text-slate-900 shadow-md border" : "text-slate-400"}`}>{m.toUpperCase()}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Referencia</label>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm focus:bg-white" placeholder="Ej: Ref Bancaria" value={formRecibo.referencia} onChange={(e) => setFormRecibo({ ...formRecibo, referencia: e.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fecha de Consignación / Transferencia</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none font-bold text-sm focus:bg-white" value={formRecibo.fechaTransaccion} onChange={(e) => setFormRecibo({ ...formRecibo, fechaTransaccion: e.target.value })} />
                  </div>
                </div>
              </div>

              <button
                onClick={procesarPago}
                disabled={procesando || totalAPagarRecibo <= 0}
                className="w-full bg-emerald-600 text-white font-black py-6 rounded-2xl shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {procesando ? <Loader2 className="animate-spin" /> : "PROCESAR Y GUARDAR"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CARGO MANUAL (VERSIÓN RÁPIDA INGRESOS) */}
      {showManualModal && resSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">

            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                  Cargo Extraordinario
                </h3>
                {/* Mostramos el residente ya fijado */}
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                  Cargando a: T{resSeleccionado.torre.slice(-1)}-{resSeleccionado.apartamento} | {resSeleccionado.nombre}
                </p>
              </div>
              <button onClick={() => setShowManualModal(false)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-300 hover:text-rose-500 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarCargoManual} className="p-8 space-y-5">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Descripción del Cargo</label>
                <input
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm uppercase focus:bg-white transition-all placeholder:text-slate-300"
                  placeholder="EJ: MULTA, DAÑO, SALÓN..."
                  value={formManual.concepto}
                  onChange={(e) => setFormManual({ ...formManual, concepto: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Periodo</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input
                      type="month"
                      className="w-full bg-slate-50 border border-slate-100 p-4 pl-10 rounded-2xl font-bold text-xs outline-none focus:bg-white"
                      value={formManual.mes}
                      onChange={(e) => setFormManual({ ...formManual, mes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest ml-1 block">Valor a Cobrar</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={14} />
                    <input
                      type="number"
                      className="w-full bg-rose-50 border border-rose-100 p-4 pl-10 rounded-2xl font-black text-sm text-rose-600 outline-none focus:bg-white focus:border-rose-300 transition-all"
                      placeholder="0.00"
                      value={formManual.valor}
                      onChange={(e) => setFormManual({ ...formManual, valor: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={guardandoManual}
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {guardandoManual ? <Loader2 className="animate-spin" size={16} /> : <>AGREGAR Y RECARGAR <ChevronRight size={14} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}