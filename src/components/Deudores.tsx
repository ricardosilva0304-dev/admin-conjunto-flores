"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Loader2, X, CheckCircle2, Plus } from "lucide-react";

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
    
    // CORRECCIÓN: Traemos todo lo que no sea 0 para incluir saldos a favor
    const { data: deudasData } = await supabase
      .from("deudas_residentes")
      .select("*, causaciones_globales(mes_causado, tipo_cobro)")
      .neq("saldo_pendiente", 0);

    if (resData) setResidentes(resData);
    if (deudasData) setDeudas(deudasData);
    setLoading(false);
  }

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

  // --- FUNCIÓN DE CÁLCULO CORREGIDA ---
  const obtenerSaldoReal = (resId: number) => {
    const deudasRes = deudas.filter(d => d.residente_id === resId);
    return deudasRes.reduce((acc: number, d) => {
      if (!d.causaciones_globales) return acc + (Number(d.saldo_pendiente) || 0);

      const m1 = d.precio_m1 || d.monto_original || 0;
      const m2 = d.precio_m2 || m1;
      const m3 = d.precio_m3 || m1;
      const pagado = m1 - (d.saldo_pendiente || 0);

      const modo = d.causaciones_globales.tipo_cobro || 'NORMAL';
      let precioActual = m1;

      if (modo === 'M1') precioActual = m1;
      else if (modo === 'M2') precioActual = m2;
      else if (modo === 'M3') precioActual = m3;
      else {
        const hoy = new Date();
        const dia = hoy.getDate();
        const mesAct = hoy.getMonth() + 1;
        const anioAct = hoy.getFullYear();
        const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);

        if (anioAct > yC || (anioAct === yC && mesAct > mC)) precioActual = m3;
        else {
          if (dia > 10 && dia <= 20) precioActual = m2;
          if (dia > 20) precioActual = m3;
        }
      }
      return acc + (precioActual - pagado);
    }, 0);
  };

  const lista = residentes.map(r => ({
    ...r,
    saldoReal: obtenerSaldoReal(r.id)
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
    if (a.torre < b.torre) return -1;
    if (a.torre > b.torre) return 1;
    return parseInt(a.apartamento) - parseInt(b.apartamento);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans text-slate-800">
      
      {/* KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-6 rounded-xl text-white">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total en Calle</p>
          <h3 className="text-2xl font-black text-emerald-400">
            ${lista.reduce((acc, r) => acc + (r.saldoReal > 0 ? r.saldoReal : 0), 0).toLocaleString('es-CO')}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Unidades con Mora</p>
          <h3 className="text-2xl font-black text-rose-500">
            {lista.filter(r => r.saldoReal > 0).length}
          </h3>
        </div>
        <div className="hidden md:flex bg-white p-6 rounded-xl border border-slate-200 items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Paz y Salvo</p>
            <h3 className="text-2xl font-black text-emerald-600">{lista.filter(r => r.saldoReal <= 0).length}</h3>
          </div>
          <CheckCircle2 className="text-emerald-100" size={36} />
        </div>
      </div>

      {/* BARRA BUSQUEDA */}
      <div className="bg-white p-2 rounded-2xl border flex flex-col md:flex-row gap-2 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            placeholder="Buscar unidad o nombre..." 
            className="w-full pl-11 pr-4 py-4 font-bold text-slate-700 outline-none"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button onClick={() => setShowManualModal(true)} className="bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
          <Plus size={14} /> Cargo Manual
        </button>
      </div>

      {/* LISTADO */}
      <div className="space-y-3">
        {lista.map(res => (
          <div key={res.id} className="bg-white border border-slate-100 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between hover:bg-slate-50 transition-all">
            <div className="flex items-center gap-5 md:w-1/3">
              <div className={`w-14 h-12 rounded-lg flex flex-col items-center justify-center font-black ${res.saldoReal > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                <span className="text-[7px]">UNIDAD</span>
                <span className="text-sm">T{res.torre.slice(-1)}-{res.apartamento}</span>
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-sm uppercase">{res.nombre}</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {res.saldoReal > 0 ? "Pendiente" : res.saldoReal < 0 ? "Saldo a Favor" : "Al día"}
                </p>
              </div>
            </div>

            <div className="text-center py-4 md:py-0">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Saldo Real Hoy</p>
               <span className={`text-2xl font-black tabular-nums ${res.saldoReal < 0 ? "text-emerald-600" : res.saldoReal > 0 ? "text-rose-600" : "text-slate-200"}`}>
                 ${Math.abs(res.saldoReal).toLocaleString('es-CO')}
               </span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setResidenteDetalle(res)} className="px-6 py-3 border rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all">Estado Cuenta</button>
              <button onClick={() => setCobroResidente(res)} className={`px-6 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${res.saldoReal > 0 ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-300 pointer-events-none"}`}>Cuenta Cobro</button>
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

      {/* MODAL CARGO MANUAL (Simplificado para el ejemplo) */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200">
            <form onSubmit={guardarCargoManual} className="p-8 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-900 uppercase text-sm tracking-tighter italic">Nuevo Cargo Manual</h3>
                <button type="button" onClick={() => setShowManualModal(false)}><X size={20} /></button>
              </div>

              <div className="relative">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Residente Responsable</label>
                <div className="relative mt-1">
                  <input
                    className="w-full bg-slate-50 border border-slate-100 p-4 pl-4 rounded-xl outline-none font-bold text-sm focus:bg-white transition-all"
                    placeholder="Escribe 5-101 o Nombre..."
                    value={formManual.residente_id ? residentes.find(r => r.id === Number(formManual.residente_id))?.nombre : busquedaManual}
                    onChange={(e) => { setBusquedaManual(e.target.value); setFormManual({ ...formManual, residente_id: "" }); }}
                  />
                </div>
                {busquedaManual && !formManual.residente_id && (
                  <div className="absolute top-[105%] left-0 right-0 bg-white border rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
                    {residentes.filter(r => (r.torre + "-" + r.apartamento + r.nombre).toLowerCase().includes(busquedaManual.toLowerCase())).slice(0, 5).map(r => (
                      <button key={r.id} type="button" onClick={() => { setFormManual({ ...formManual, residente_id: r.id.toString() }); setBusquedaManual(""); }} className="w-full p-3 text-left hover:bg-slate-50 border-b text-xs font-bold uppercase">
                        {r.nombre} (T{r.torre.slice(-1)}-{r.apartamento})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Concepto</label>
                <input className="w-full bg-slate-50 border p-4 rounded-xl font-bold outline-none uppercase mt-1" value={formManual.concepto} onChange={(e) => setFormManual({ ...formManual, concepto: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Mes</label>
                  <input type="month" className="w-full bg-slate-50 border p-4 rounded-xl font-bold text-sm mt-1" value={formManual.mes} onChange={(e) => setFormManual({ ...formManual, mes: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor</label>
                  <input type="number" className="w-full bg-emerald-50 border border-emerald-100 p-4 rounded-xl font-black text-emerald-600 mt-1" value={formManual.valor} onChange={(e) => setFormManual({ ...formManual, valor: e.target.value })} required />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] mt-4">Guardar Cargo</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}