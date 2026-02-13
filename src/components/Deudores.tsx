"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  Search, Loader2, X, CheckCircle2,
  Plus, FileText, Wallet, LayoutGrid, DollarSign, Calendar, ChevronRight
} from "lucide-react";

// Documentos
import EstadoCuenta from "./EstadoCuenta";
import CuentaCobro from "./CuentaCobro";

export default function Deudores() {
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

  // --- LISTADO ORGANIZADO POR UBICACIÓN ---
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
      // 1. Ordenar por Torre
      if (a.torre !== b.torre) return a.torre.localeCompare(b.torre);
      // 2. Ordenar por Apartamento numéricamente
      return parseInt(a.apartamento) - parseInt(b.apartamento);
    });
  }, [residentes, deudas, busqueda, filtroTorre]);

  // KPIs Globales
  const totalCartera = lista.reduce((acc, r) => acc + (r.saldoReal > 0 ? r.saldoReal : 0), 0);
  const totalAnticipos = lista.reduce((acc, r) => acc + (r.saldoReal < 0 ? Math.abs(r.saldoReal) : 0), 0);

  async function guardarCargoManual(e: React.FormEvent) {
    e.preventDefault();
    if (!formManual.residente_id || !formManual.valor) return;
    setLoading(true);

    // --- LÓGICA PARA CONVERTIR MES A LETRAS ---
    const [anio, mesNum] = formManual.mes.split("-");
    const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const periodoTexto = `${mesesNombres[parseInt(mesNum) - 1]} ${anio}`;

    // Concepto final: MULTA (FEBRERO 2026)
    const conceptoFinal = `${formManual.concepto.toUpperCase()} (${periodoTexto})`;

    const monto = parseFloat(formManual.valor);

    const { error } = await supabase.from("deudas_residentes").insert([{
      residente_id: parseInt(formManual.residente_id),
      concepto_nombre: conceptoFinal, // Guardamos con el mes en letras
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

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans text-slate-800">

      {/* RESUMEN DE CARTERA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Cartera en Calle</p>
            <h3 className="text-2xl font-black text-rose-400 tabular-nums">${totalCartera.toLocaleString('es-CO')}</h3>
          </div>
          <Wallet className="opacity-20" size={32} />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest">Saldos a Favor</p>
            <h3 className="text-2xl font-black text-emerald-600 tabular-nums">${totalAnticipos.toLocaleString('es-CO')}</h3>
          </div>
          <CheckCircle2 className="text-emerald-100" size={32} />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Unidades Morosas</p>
            <h3 className="text-2xl font-black text-slate-800">{lista.filter(r => r.saldoReal > 0).length} / {residentes.length}</h3>
          </div>
          <LayoutGrid className="text-slate-100" size={32} />
        </div>
      </div>

      {/* FILTROS GEOGRÁFICOS */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-2 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            placeholder="Ej: 5-101 o Nombre del titular..."
            className="w-full pl-12 pr-4 py-4 font-bold text-slate-700 outline-none"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar items-center bg-slate-50 rounded-2xl px-2">
          {["TODAS", "1", "5", "6", "7", "8"].map(t => (
            <button key={t} onClick={() => setFiltroTorre(t === "TODAS" ? "TODAS" : `Torre ${t}`)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${filtroTorre === (t === "TODAS" ? "TODAS" : `Torre ${t}`) ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:bg-slate-200"}`}>
              {t === "TODAS" ? "TODO" : `T${t}`}
            </button>
          ))}
        </div>

        <button onClick={() => setShowManualModal(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95">
          CARGO MANUAL
        </button>
      </div>

      {/* LISTADO POR UNIDADES */}
      <div className="space-y-2">
        {lista.map(res => {
          const esMora = res.saldoReal > 0;
          const esFavor = res.saldoReal < 0;
          const esAlDia = res.saldoReal === 0;

          return (
            <div key={res.id} className={`bg-white border p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between transition-all ${esFavor ? "border-emerald-200 bg-emerald-50/10" : esMora ? "border-rose-100" : "border-slate-50 opacity-80"}`}>

              <div className="flex items-center gap-6 md:w-2/5">
                <div className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center font-black shadow-sm ${esMora ? "bg-rose-50 text-rose-600" : esFavor ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  <span className="text-[7px] uppercase opacity-60">Unidad</span>
                  <span className="text-sm">T{res.torre.slice(-1)}-{res.apartamento}</span>
                </div>
                <div className="truncate">
                  <h4 className={`font-black text-sm uppercase truncate ${esAlDia ? 'text-slate-400' : 'text-slate-800'}`}>{res.nombre}</h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${esMora ? 'text-rose-400' : esFavor ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {esMora ? "Deuda Pendiente" : esFavor ? "Saldo a Favor" : "Paz y Salvo"}
                  </span>
                </div>
              </div>

              <div className="text-center py-4 md:py-0 md:w-1/4">
                <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Estado Contable</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-xl font-black tabular-nums ${esFavor ? "text-emerald-600" : esMora ? "text-rose-600" : "text-slate-200"}`}>
                    ${Math.abs(res.saldoReal).toLocaleString('es-CO')}
                  </span>
                  {esFavor && <span className="text-[9px] font-black text-emerald-500 uppercase">CR</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setResidenteDetalle(res)} className="px-5 py-3 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center gap-2">
                  <FileText size={14} /> Estado Cuenta
                </button>

                <button
                  onClick={() => setCobroResidente(res)}
                  disabled={!esMora}
                  className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${esMora ? "bg-slate-900 text-white shadow-lg active:scale-95" : "bg-slate-50 text-slate-200 cursor-not-allowed"}`}
                >
                  Cuenta Cobro
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODALES */}
      {residenteDetalle && (
        <EstadoCuenta residente={residenteDetalle} deudas={deudas.filter(d => d.residente_id === residenteDetalle.id)} onClose={() => setResidenteDetalle(null)} />
      )}
      {cobroResidente && (
        <CuentaCobro residente={cobroResidente} deudas={deudas.filter(d => d.residente_id === cobroResidente.id)} onClose={() => setCobroResidente(null)} />
      )}

      {/* MODAL CARGO MANUAL REDISEÑADO */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">

            {/* HEADER DEL MODAL */}
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
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

            <form onSubmit={guardarCargoManual} className="p-8 space-y-5">

              {/* BUSCADOR DE RESIDENTE INTELIGENTE */}
              <div className="relative group">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Unidad Responsable</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
                  <input
                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none font-bold text-sm focus:bg-white focus:ring-4 ring-emerald-500/5 transition-all"
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
                    <button
                      type="button"
                      onClick={() => { setFormManual({ ...formManual, residente_id: "" }); setBusquedaManual(""); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* LISTA DE SUGERENCIAS (CON LÓGICA 5-101) */}
                {busquedaManual && !formManual.residente_id && (
                  <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-100 z-[1000] max-h-48 overflow-y-auto shadow-2xl rounded-2xl py-2 animate-in slide-in-from-top-2">
                    {residentes
                      .filter(r => {
                        const term = busquedaManual.toLowerCase().trim();
                        // Lógica 5-101
                        if (term.includes("-")) {
                          const [t, a] = term.split("-");
                          return r.torre.includes(t) && r.apartamento.startsWith(a);
                        }
                        // Búsqueda normal
                        return r.nombre.toLowerCase().includes(term) || r.apartamento.includes(term);
                      })
                      .slice(0, 5)
                      .map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setFormManual({ ...formManual, residente_id: r.id.toString() });
                            setBusquedaManual("");
                          }}
                          className="w-full px-5 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 uppercase">{r.nombre}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{r.torre}</span>
                          </div>
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            Apto {r.apartamento}
                          </span>
                        </button>
                      ))
                    }
                    {/* Mensaje si no hay resultados */}
                    {residentes.filter(r => {
                      const term = busquedaManual.toLowerCase().trim();
                      if (term.includes("-")) {
                        const [t, a] = term.split("-");
                        return r.torre.includes(t) && r.apartamento.startsWith(a);
                      }
                      return r.nombre.toLowerCase().includes(term) || r.apartamento.includes(term);
                    }).length === 0 && (
                        <div className="p-4 text-center text-[10px] font-bold text-slate-300 uppercase">Unidad no encontrada</div>
                      )}
                  </div>
                )}
              </div>

              {/* CONCEPTO */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Descripción del Cargo</label>
                <input
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-sm uppercase focus:bg-white transition-all placeholder:text-slate-300"
                  placeholder="EJ: MULTA POR RUIDO"
                  value={formManual.concepto}
                  onChange={(e) => setFormManual({ ...formManual, concepto: e.target.value })}
                  required
                />
              </div>

              {/* MES Y MONTO */}
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
                  <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest ml-1 block">Valor de Deuda</label>
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

              {/* BOTÓN DE ACCIÓN */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
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