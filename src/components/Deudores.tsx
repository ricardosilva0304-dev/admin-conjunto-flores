"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  Search, Loader2, X, CheckCircle2,
  Plus, FileText, Wallet, LayoutGrid, DollarSign, Calendar, ChevronRight
} from "lucide-react";

import EstadoCuenta from "./EstadoCuenta";
import CuentaCobro from "./CuentaCobro";

export default function Deudores({ role }: { role?: string }) {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTorre, setFiltroTorre] = useState("TODAS");
  const [showManualModal, setShowManualModal] = useState(false);

  const [residenteDetalle, setResidenteDetalle] = useState<any>(null);
  const [cobroResidente, setCobroResidente] = useState<any>(null);
  const [busquedaManual, setBusquedaManual] = useState("");
  const [formManual, setFormManual] = useState({
    residente_id: "", concepto: "", mes: new Date().toISOString().split('-').slice(0, 2).join('-'), valor: ""
  });

  useEffect(() => { cargarInformacion(); }, []);

  async function cargarInformacion() {
    setLoading(true);
    const { data: resData } = await supabase.from("residentes").select("*");
    const { data: deudasData } = await supabase
      .from("deudas_residentes")
      .select("*, causaciones_globales(mes_causado, tipo_cobro)")
      .neq("saldo_pendiente", 0);

    if (resData) setResidentes(resData);
    if (deudasData) setDeudas(deudasData);
    setLoading(false);
  }

  const lista = useMemo(() => {
    return residentes.map(r => {
      const deudasUnidad = deudas.filter(d => d.residente_id === r.id);
      const saldoReal = deudasUnidad.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);
      return { ...r, saldoReal };
    }).filter(r => {
      const term = busqueda.toLowerCase().trim();
      const coincideTorre = filtroTorre === "TODAS" || r.torre === filtroTorre;
      if (!term) return coincideTorre;
      if (term.includes("-")) {
        const [t, a] = term.split("-");
        return r.torre.includes(t) && r.apartamento.startsWith(a) && coincideTorre;
      }
      return (r.nombre.toLowerCase().includes(term) || r.apartamento.includes(term)) && coincideTorre;
    }).sort((a, b) => {
      if (a.torre !== b.torre) return a.torre.localeCompare(b.torre);
      return parseInt(a.apartamento) - parseInt(b.apartamento);
    });
  }, [residentes, deudas, busqueda, filtroTorre]);

  const totalCartera = lista.reduce((acc, r) => acc + (r.saldoReal > 0 ? r.saldoReal : 0), 0);
  const totalAnticipos = lista.reduce((acc, r) => acc + (r.saldoReal < 0 ? Math.abs(r.saldoReal) : 0), 0);

  async function guardarCargoManual(e: React.FormEvent) {
    e.preventDefault();
    if (!formManual.residente_id || !formManual.valor) return;
    setLoading(true);

    const [anio, mesNum] = formManual.mes.split("-");
    const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const periodoTexto = `${mesesNombres[parseInt(mesNum) - 1]} ${anio}`;
    const conceptoFinal = `${formManual.concepto.toUpperCase()} (${periodoTexto})`;
    const monto = parseFloat(formManual.valor);

    const { error } = await supabase.from("deudas_residentes").insert([{
      residente_id: parseInt(formManual.residente_id),
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
      cargarInformacion();
      setFormManual({ residente_id: "", concepto: "", mes: formManual.mes, valor: "" });
      setBusquedaManual("");
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={28} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-20 px-0 font-sans text-slate-800">

      {/* ── KPI CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Cartera en Calle</p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-400 tabular-nums">
              ${totalCartera.toLocaleString('es-CO')}
            </h3>
          </div>
          <Wallet className="opacity-20 flex-shrink-0" size={28} />
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-emerald-500 uppercase mb-1 tracking-widest">Saldos a Favor</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
              ${totalAnticipos.toLocaleString('es-CO')}
            </h3>
          </div>
          <CheckCircle2 className="text-emerald-100 flex-shrink-0" size={28} />
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Unidades Morosas</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">
              {lista.filter(r => r.saldoReal > 0).length}
              <span className="text-sm text-slate-400 font-bold"> / {residentes.length}</span>
            </h3>
          </div>
          <LayoutGrid className="text-slate-100 flex-shrink-0" size={28} />
        </div>
      </div>

      {/* ── FILTROS ───────────────────────────────────────────── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 flex flex-col gap-2.5 shadow-sm">

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            placeholder="Ej: 5-101 o Nombre del titular..."
            className="w-full pl-11 pr-4 py-3 sm:py-3.5 font-bold text-slate-700 outline-none bg-slate-50 rounded-xl text-sm focus:bg-white transition-all"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Torres + Cargo Manual en una sola fila que NUNCA hace scroll */}
        <div className="flex items-center gap-2">

          {/* Grid de torres — 6 columnas fijas, se encogen según el espacio */}
          <div className="flex-1 min-w-0 grid grid-cols-6 gap-1 bg-slate-50 rounded-xl p-1">
            {[
              { key: "TODAS", label: "Todo" },
              { key: "Torre 1", label: "T1" },
              { key: "Torre 5", label: "T5" },
              { key: "Torre 6", label: "T6" },
              { key: "Torre 7", label: "T7" },
              { key: "Torre 8", label: "T8" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltroTorre(key)}
                className={`py-2 rounded-lg text-[9px] sm:text-[10px] font-black transition-all truncate ${filtroTorre === key
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:bg-slate-200"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Botón cargo manual — compacto en móvil */}
          {role !== 'contador' && (
            <button
              onClick={() => setShowManualModal(true)}
              className="flex-shrink-0 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg active:scale-95
                px-3 py-2.5 text-[9px]
                sm:px-5 sm:py-3 sm:text-[10px]"
            >
              <span className="hidden sm:inline">CARGO MANUAL</span>
              <span className="sm:hidden">+ Cargo</span>
            </button>
          )}
        </div>
      </div>

      {/* ── LISTADO POR UNIDADES ──────────────────────────────── */}
      <div className="space-y-2">
        {lista.map(res => {
          const esMora = res.saldoReal > 0;
          const esFavor = res.saldoReal < 0;
          const esAlDia = res.saldoReal === 0;

          return (
            <div
              key={res.id}
              className={`bg-white border p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all
                ${esFavor ? "border-emerald-200 bg-emerald-50/10" : esMora ? "border-rose-100" : "border-slate-50 opacity-80"}`}
            >
              {/* Identidad */}
              <div className="flex items-center gap-3 sm:gap-6 sm:w-2/5">
                <div className={`w-12 h-11 sm:w-14 sm:h-12 rounded-xl flex flex-col items-center justify-center font-black shadow-sm flex-shrink-0
                  ${esMora ? "bg-rose-50 text-rose-600" : esFavor ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  <span className="text-[6px] uppercase opacity-60">Unidad</span>
                  <span className="text-xs sm:text-sm">T{res.torre.slice(-1)}-{res.apartamento}</span>
                </div>
                <div className="min-w-0">
                  <h4 className={`font-black text-xs sm:text-sm uppercase truncate ${esAlDia ? 'text-slate-400' : 'text-slate-800'}`}>
                    {res.nombre}
                  </h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${esMora ? 'text-rose-400' : esFavor ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {esMora ? "Deuda Pendiente" : esFavor ? "Saldo a Favor" : "Paz y Salvo"}
                  </span>
                </div>
              </div>

              {/* Monto + acciones en la misma fila en móvil */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-8">

                {/* Saldo */}
                <div className="sm:text-center">
                  <p className="text-[7px] font-black text-slate-300 uppercase mb-0.5 hidden sm:block">Estado</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-black tabular-nums text-base sm:text-xl
                      ${esFavor ? "text-emerald-600" : esMora ? "text-rose-600" : "text-slate-200"}`}>
                      ${Math.abs(res.saldoReal).toLocaleString('es-CO')}
                    </span>
                    {esFavor && <span className="text-[8px] font-black text-emerald-500 uppercase">CR</span>}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setResidenteDetalle(res)}
                    className="px-3 sm:px-5 py-2.5 sm:py-3 border border-slate-100 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center gap-1.5"
                  >
                    <FileText size={12} />
                    <span className="hidden xs:inline sm:hidden md:inline">Estado</span>
                    <span className="hidden sm:inline md:hidden">Edo.</span>
                  </button>
                  <button
                    onClick={() => setCobroResidente(res)}
                    disabled={!esMora}
                    className={`px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all
                      ${esMora ? "bg-slate-900 text-white shadow-lg active:scale-95" : "bg-slate-50 text-slate-200 cursor-not-allowed"}`}
                  >
                    Cobro
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODALES ───────────────────────────────────────────── */}
      {residenteDetalle && (
        <EstadoCuenta
          residente={residenteDetalle}
          deudas={deudas.filter(d => d.residente_id === residenteDetalle.id)}
          onClose={() => setResidenteDetalle(null)}
        />
      )}
      {cobroResidente && (
        <CuentaCobro
          residente={cobroResidente}
          deudas={deudas.filter(d => d.residente_id === cobroResidente.id)}
          onClose={() => setCobroResidente(null)}
        />
      )}

      {/* MODAL CARGO MANUAL */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

            <div className="bg-slate-50 px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                  Cargar Obligación Manual
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Gestión Extraordinaria de Cartera</p>
              </div>
              <button
                onClick={() => { setShowManualModal(false); setBusquedaManual(""); }}
                className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-300 hover:text-rose-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarCargoManual} className="p-6 sm:p-8 space-y-4 sm:space-y-5">

              {/* Buscador residente */}
              <div className="relative group">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Unidad Responsable</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={15} />
                  <input
                    className="w-full bg-slate-50 border border-slate-100 p-3.5 pl-11 rounded-2xl outline-none font-bold text-sm focus:bg-white focus:ring-4 ring-emerald-500/5 transition-all"
                    placeholder="Busca por Nombre o Apto (ej: 5-101)"
                    value={formManual.residente_id
                      ? `${residentes.find(r => r.id === Number(formManual.residente_id))?.nombre} | T${residentes.find(r => r.id === Number(formManual.residente_id))?.torre.slice(-1)}-${residentes.find(r => r.id === Number(formManual.residente_id))?.apartamento}`
                      : busquedaManual
                    }
                    onChange={(e) => {
                      setBusquedaManual(e.target.value);
                      setFormManual({ ...formManual, residente_id: "" });
                    }}
                  />
                  {formManual.residente_id && (
                    <button type="button" onClick={() => { setFormManual({ ...formManual, residente_id: "" }); setBusquedaManual(""); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {busquedaManual && !formManual.residente_id && (
                  <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-100 z-[1000] max-h-48 overflow-y-auto shadow-2xl rounded-2xl py-2 animate-in slide-in-from-top-2">
                    {residentes.filter(r => {
                      const term = busquedaManual.toLowerCase().trim();
                      if (term.includes("-")) {
                        const [t, a] = term.split("-");
                        return r.torre.includes(t) && r.apartamento.startsWith(a);
                      }
                      return r.nombre.toLowerCase().includes(term) || r.apartamento.includes(term);
                    }).slice(0, 5).map(r => (
                      <button key={r.id} type="button" onClick={() => { setFormManual({ ...formManual, residente_id: r.id.toString() }); setBusquedaManual(""); }} className="w-full px-5 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700 uppercase">{r.nombre}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{r.torre}</span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          Apto {r.apartamento}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Concepto */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Descripción del Cargo</label>
                <input
                  className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-2xl outline-none font-bold text-sm uppercase focus:bg-white transition-all placeholder:text-slate-300"
                  placeholder="EJ: MULTA POR RUIDO"
                  value={formManual.concepto}
                  onChange={(e) => setFormManual({ ...formManual, concepto: e.target.value })}
                  required
                />
              </div>

              {/* Mes + Valor */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Periodo</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                    <input type="month" className="w-full bg-slate-50 border border-slate-100 p-3.5 pl-9 rounded-2xl font-bold text-xs outline-none focus:bg-white" value={formManual.mes} onChange={(e) => setFormManual({ ...formManual, mes: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest ml-1 block">Valor</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300" size={13} />
                    <input type="number" inputMode="numeric" className="w-full bg-rose-50 border border-rose-100 p-3.5 pl-9 rounded-2xl font-black text-sm text-rose-600 outline-none focus:bg-white focus:border-rose-300 transition-all" placeholder="0" value={formManual.valor} onChange={(e) => setFormManual({ ...formManual, valor: e.target.value })} required />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 sm:py-5 rounded-[1.5rem] uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <>GUARDAR EN CARTERA <ChevronRight size={14} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}