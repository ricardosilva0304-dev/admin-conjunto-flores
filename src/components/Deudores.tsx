"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, Loader2, X, CheckCircle2,
  Plus, User, Wallet
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
  const [busquedaManual, setBusquedaManual] = useState("");

  const [residenteDetalle, setResidenteDetalle] = useState<any>(null);
  const [cobroResidente, setCobroResidente] = useState<any>(null);

  const [showManualModal, setShowManualModal] = useState(false);
  const [formManual, setFormManual] = useState({
    residente_id: "",
    concepto: "",
    mes: new Date().toISOString().split('-').slice(0, 2).join('-'),
    valor: ""
  });

  useEffect(() => { cargarInformacion(); }, []);

  async function cargarInformacion() {
    setLoading(true);
    const { data: resData } = await supabase.from("residentes").select("*");
    const { data: deudasData } = await supabase
      .from("deudas_residentes")
      .select("*, causaciones_globales(mes_causado, tipo_cobro)")
      .gt("saldo_pendiente", 0);

    if (resData) setResidentes(resData);
    if (deudasData) setDeudas(deudasData);
    setLoading(false);
  }

  // --- FUNCIÓN PARA GUARDAR CARGO MANUAL ---
  async function guardarCargoManual(e: React.FormEvent) {
    e.preventDefault();
    if (!formManual.residente_id || !formManual.valor) return alert("Faltan datos");

    setLoading(true);
    const monto = parseFloat(formManual.valor);
    const conceptoFinal = `${formManual.concepto.toUpperCase()} (${formManual.mes})`;

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
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  }

  // --- LÓGICA DE CÁLCULO DE DEUDA REAL (PROTEGIDA) ---
  const calcularDeudaReal = (resId: number) => {
    const deudasRes = deudas.filter(d => d.residente_id === resId);
    return deudasRes.reduce((acc, d) => {
      // 1. Si es cargo manual (sin causación global)
      if (!d.causaciones_globales) return acc + (Number(d.saldo_pendiente) || 0);

      // Valores Base
      const m1 = d.precio_m1 || d.monto_original || 0;
      const m2 = d.precio_m2 || m1;
      const m3 = d.precio_m3 || m1;
      const pagado = m1 - (d.saldo_pendiente || 0);

      // 2. Revisar si hay un modo de tarifa forzado (M1, M2, M3)
      const modo = d.causaciones_globales.tipo_cobro || 'NORMAL';
      let precioFinal = m1;

      if (modo === 'M1') precioFinal = m1;
      else if (modo === 'M2') precioFinal = m2;
      else if (modo === 'M3') precioFinal = m3;
      else {
        // 3. Modo NORMAL (Cálculo automático por fecha)
        const hoy = new Date();
        const dia = hoy.getDate();
        const mesAct = hoy.getMonth() + 1;
        const anioAct = hoy.getFullYear();
        const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);

        if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
          precioFinal = m3;
        } else {
          if (dia > 10 && dia <= 20) precioFinal = m2;
          if (dia > 20) precioFinal = m3;
        }
      }

      return acc + Math.max(0, precioFinal - pagado);
    }, 0);
  };

  // --- LÓGICA DE LISTADO Y ORDENAMIENTO POR UBICACIÓN ---
  const lista = residentes.map(r => ({
    ...r,
    saldoReal: calcularDeudaReal(r.id)
  })).filter(r => {
    const term = busqueda.toLowerCase().trim();
    const coincideTorre = filtroTorre === "TODAS" || r.torre === filtroTorre;
    if (!term) return coincideTorre;
    if (term.includes("-")) {
      const [t, a] = term.split("-");
      return r.torre.includes(t) && r.apartamento.startsWith(a) && coincideTorre;
    }
    return (r.nombre.toLowerCase().includes(term) || r.apartamento.includes(term)) && coincideTorre;
  }).sort((a, b) => {
    // 1. Comparar Torres (Alfabetico)
    if (a.torre < b.torre) return -1;
    if (a.torre > b.torre) return 1;
    // 2. Misma torre, comparar Apartamento (Numérico)
    return parseInt(a.apartamento) - parseInt(b.apartamento);
  });

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans text-slate-800">

      {/* 1. KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-slate-900 p-6 rounded-xl text-white">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Total en Calle</p>
          <h3 className="text-2xl md:text-3xl font-black tabular-nums text-emerald-400">
            ${lista.reduce((acc, r) => acc + r.saldoReal, 0).toLocaleString('es-CO')}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 text-center md:text-left">Unidades con Mora</p>
          <h3 className="text-2xl md:text-3xl font-black text-rose-500 text-center md:text-left">
            {lista.filter(r => r.saldoReal > 0).length}
          </h3>
        </div>
        <div className="hidden md:flex bg-white p-6 rounded-xl border border-slate-200 items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Paz y Salvo</p>
            <h3 className="text-3xl font-black text-emerald-600">
              {lista.filter(r => r.saldoReal === 0).length}
            </h3>
          </div>
          <CheckCircle2 className="text-emerald-100" size={36} />
        </div>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            placeholder="Buscar por apto o nombre..."
            className="w-full bg-transparent pl-11 pr-4 py-4 font-bold text-slate-700 outline-none placeholder:text-slate-300"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar md:bg-slate-50 md:rounded-xl">
          {["TODAS", "1", "5", "6", "7", "8"].map(t => (
            <button
              key={t}
              onClick={() => setFiltroTorre(t === "TODAS" ? "TODAS" : `Torre ${t}`)}
              className={`px-5 py-2.5 rounded-lg text-[9px] font-black transition-all ${(filtroTorre === "TODAS" && t === "TODAS") || filtroTorre === `Torre ${t}`
                ? "bg-slate-900 text-white"
                : "text-slate-400"
                }`}
            >
              {t === "TODAS" ? "TODO" : `T${t}`}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowManualModal(true)}
          className="bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Plus size={14} /> Cargo Manual
        </button>
      </div>

      {/* 3. LISTADO */}
      <div className="space-y-2 md:space-y-3">
        {lista.map(res => (
          <div key={res.id} className="bg-white border border-slate-100 p-4 md:p-6 rounded-xl md:rounded-2xl flex flex-col md:flex-row md:items-center justify-between transition-all hover:bg-slate-50">

            <div className="flex items-center gap-5 md:w-1/3 mb-4 md:mb-0">
              <div className={`w-14 h-12 rounded-lg flex flex-col items-center justify-center font-black ${res.saldoReal > 0 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                <span className="text-[7px] uppercase font-bold mb-0.5">UNIDAD</span>
                <span className="text-sm">T{res.torre.replace("Torre ", "")}-{res.apartamento}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-slate-800 font-bold text-sm uppercase truncate max-w-[150px]">{res.nombre}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${res.saldoReal > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    {res.saldoReal > 0 ? "Tiene Pendientes" : "Al día"}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right flex items-center md:flex-col justify-between md:justify-center border-t md:border-t-0 md:border-x border-slate-100 pt-3 md:pt-0 md:px-10 mb-4 md:mb-0">
              <p className="text-[9px] font-black text-slate-400 uppercase md:mb-1 tracking-widest">Saldo Real Hoy</p>
              <span className={`text-xl md:text-2xl font-black tabular-nums tracking-tighter ${res.saldoReal > 0 ? "text-rose-600" : "text-slate-200"}`}>
                ${res.saldoReal.toLocaleString('es-CO')}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setResidenteDetalle(res)}
                className="flex-1 md:flex-none px-6 py-3 border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95"
              >
                Estado Cuenta
              </button>
              <button
                onClick={() => setCobroResidente(res)}
                className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${res.saldoReal > 0 ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-300 pointer-events-none"}`}
              >
                Cuenta Cobro
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* MODALES */}
      {residenteDetalle && (
        <EstadoCuenta residente={residenteDetalle} deudas={deudas.filter(d => d.residente_id === residenteDetalle.id)} onClose={() => setResidenteDetalle(null)} />
      )}
      {cobroResidente && (
        <CuentaCobro residente={cobroResidente} deudas={deudas.filter(d => d.residente_id === cobroResidente.id)} onClose={() => setCobroResidente(null)} />
      )}

      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border">
            <form onSubmit={guardarCargoManual} className="p-8 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-900 uppercase text-sm tracking-tighter italic">Cargo Manual</h3>
                <button type="button" onClick={() => setShowManualModal(false)}><X size={20} /></button>
              </div>

              <div className="relative">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Seleccionar Residente</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-xl outline-none font-bold text-sm focus:bg-white transition-all"
                    placeholder="Ej: 5-101 o Nombre..."
                    value={formManual.residente_id
                      ? residentes.find(r => r.id === Number(formManual.residente_id))?.nombre + " | " + residentes.find(r => r.id === Number(formManual.residente_id))?.apartamento
                      : busquedaManual}
                    onChange={(e) => {
                      setBusquedaManual(e.target.value);
                      setFormManual({ ...formManual, residente_id: "" });
                    }}
                  />
                  {formManual.residente_id && (
                    <button
                      onClick={() => { setFormManual({ ...formManual, residente_id: "" }); setBusquedaManual(""); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {busquedaManual && !formManual.residente_id && (
                  <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-48 overflow-y-auto">
                    {residentes
                      .filter(r => {
                        const term = busquedaManual.toLowerCase();
                        const unidad = `${r.torre.replace("Torre ", "")}-${r.apartamento}`;
                        return r.nombre.toLowerCase().includes(term) || unidad.includes(term);
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
                          className="w-full p-3 text-left hover:bg-slate-50 border-b border-slate-50 flex justify-between items-center"
                        >
                          <span className="text-xs font-bold text-slate-700 uppercase">{r.nombre}</span>
                          <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded">
                            T{r.torre.replace("Torre ", "")}-{r.apartamento}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Concepto del Cobro</label>
                <input
                  className="w-full bg-slate-50 border p-4 rounded-xl font-bold outline-none uppercase"
                  placeholder="EJ: MULTA POR RUIDO"
                  value={formManual.concepto}
                  onChange={(e) => setFormManual({ ...formManual, concepto: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Mes de Referencia</label>
                  <input
                    type="month"
                    className="w-full bg-slate-50 border p-4 rounded-xl font-bold text-sm outline-none"
                    value={formManual.mes}
                    onChange={(e) => setFormManual({ ...formManual, mes: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor a Cobrar</label>
                  <input
                    type="number"
                    className="w-full bg-emerald-50 border-emerald-100 p-4 rounded-xl font-black text-emerald-600 outline-none"
                    placeholder="0"
                    value={formManual.valor}
                    onChange={(e) => setFormManual({ ...formManual, valor: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] mt-4">
                Confirmar y Cargar a Cuenta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}