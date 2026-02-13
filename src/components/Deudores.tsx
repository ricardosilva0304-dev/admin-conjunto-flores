"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils"; // Importante: Lógica unificada
import {
  Search, Loader2, X, CheckCircle2,
  Plus, FileText, AlertTriangle, Wallet
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
      .neq("saldo_pendiente", 0);

    if (resData) setResidentes(resData);
    if (deudasData) setDeudas(deudasData);
    setLoading(false);
  }

  // --- LISTADO FILTRADO Y ORDENADO ---
  const lista = useMemo(() => {
    return residentes.map(r => {
      const deudasRes = deudas.filter(d => d.residente_id === r.id);
      // USAMOS LA LIBRERÍA CENTRALIZADA PARA EL CÁLCULO
      const saldoReal = deudasRes.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);
      
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
    }).sort((a, b) => b.saldoReal - a.saldoReal); // Deudores arriba, saldos a favor abajo
  }, [residentes, deudas, busqueda, filtroTorre]);

  // Totales para KPIs
  const totalCartera = lista.reduce((acc, r) => acc + (r.saldoReal > 0 ? r.saldoReal : 0), 0);
  const totalAnticipos = lista.reduce((acc, r) => acc + (r.saldoReal < 0 ? Math.abs(r.saldoReal) : 0), 0);

  async function guardarCargoManual(e: React.FormEvent) {
    e.preventDefault();
    if (!formManual.residente_id || !formManual.valor) return alert("Faltan datos");
    setLoading(true);
    const monto = parseFloat(formManual.valor);
    const { error } = await supabase.from("deudas_residentes").insert([{
      residente_id: parseInt(formManual.residente_id),
      concepto_nombre: `${formManual.concepto.toUpperCase()} (${formManual.mes})`,
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

      {/* KPIS FINANCIEROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Cartera Pendiente</p>
          <h3 className="text-2xl font-black text-rose-400 tabular-nums">${totalCartera.toLocaleString('es-CO')}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest">Anticipos (A Favor)</p>
          <h3 className="text-2xl font-black text-emerald-600 tabular-nums">${totalAnticipos.toLocaleString('es-CO')}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Unidades en Mora</p>
            <h3 className="text-2xl font-black text-rose-500">{lista.filter(r => r.saldoReal > 0).length}</h3>
          </div>
          <CheckCircle2 className="text-emerald-100" size={32} />
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-2 rounded-2xl border flex flex-col md:flex-row gap-2 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            placeholder="Buscar unidad (5-101) o nombre..."
            className="w-full pl-11 pr-4 py-4 font-bold text-slate-700 outline-none"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar items-center bg-slate-50 rounded-xl px-2">
          {["TODAS", "5", "6", "7", "8"].map(t => (
            <button key={t} onClick={() => setFiltroTorre(t === "TODAS" ? "TODAS" : `Torre ${t}`)} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${filtroTorre === (t === "TODAS" ? "TODAS" : `Torre ${t}`) ? "bg-slate-900 text-white" : "text-slate-400"}`}>
              {t === "TODAS" ? "TODO" : `T${t}`}
            </button>
          ))}
        </div>

        <button onClick={() => setShowManualModal(true)} className="bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg">
          <Plus size={14} /> Cargo Manual
        </button>
      </div>

      {/* LISTADO DE ESTADOS DE CUENTA */}
      <div className="space-y-3">
        {lista.map(res => (
          <div key={res.id} className={`bg-white border p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between transition-all ${res.saldoReal < 0 ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100 hover:border-emerald-200"}`}>
            
            <div className="flex items-center gap-5 md:w-1/3">
              <div className={`w-14 h-12 rounded-lg flex flex-col items-center justify-center font-black ${res.saldoReal > 0 ? "bg-rose-50 text-rose-600" : res.saldoReal < 0 ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-100 text-slate-400"}`}>
                <span className="text-[7px]">UNIDAD</span>
                <span className="text-sm">T{res.torre.slice(-1)}-{res.apartamento}</span>
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-sm uppercase truncate max-w-[180px]">{res.nombre}</h4>
                <p className={`text-[9px] font-black uppercase tracking-widest ${res.saldoReal > 0 ? "text-rose-400" : res.saldoReal < 0 ? "text-emerald-500" : "text-slate-300"}`}>
                  {res.saldoReal > 0 ? "Mora Pendiente" : res.saldoReal < 0 ? "Saldo a Favor" : "Al día"}
                </p>
              </div>
            </div>

            <div className="text-center py-4 md:py-0">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Saldo Actual Hoy</p>
               <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-xl font-black tabular-nums ${res.saldoReal < 0 ? "text-emerald-600" : res.saldoReal > 0 ? "text-rose-600" : "text-slate-300"}`}>
                    ${Math.abs(res.saldoReal).toLocaleString('es-CO')}
                  </span>
                  {res.saldoReal < 0 && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">CR</span>}
               </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setResidenteDetalle(res)} className="px-5 py-3 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                <FileText size={14}/> Estado Cuenta
              </button>

              <button 
                onClick={() => setCobroResidente(res)} 
                disabled={res.saldoReal <= 0}
                className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${res.saldoReal > 0 ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-200"}`}
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

      {/* MODAL CARGO MANUAL */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95">
            <form onSubmit={guardarCargoManual} className="p-8 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-900 uppercase text-sm tracking-tighter">Cargar Deuda Manual</h3>
                <button type="button" onClick={() => setShowManualModal(false)}><X size={20} /></button>
              </div>
              <div className="relative">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Buscar Residente</label>
                <input
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold text-sm mt-1"
                  placeholder="Escribe para buscar..."
                  value={formManual.residente_id ? residentes.find(r => r.id === Number(formManual.residente_id))?.nombre : busquedaManual}
                  onChange={(e) => { setBusquedaManual(e.target.value); setFormManual({ ...formManual, residente_id: "" }); }}
                />
                {busquedaManual && !formManual.residente_id && (
                  <div className="absolute top-[100%] left-0 right-0 bg-white border z-[1000] max-h-40 overflow-y-auto shadow-2xl rounded-b-xl">
                    {residentes.filter(r => (r.nombre + r.apartamento).toLowerCase().includes(busquedaManual.toLowerCase())).map(r => (
                      <button key={r.id} type="button" onClick={() => { setFormManual({ ...formManual, residente_id: r.id.toString() }); setBusquedaManual(""); }} className="w-full p-3 text-left hover:bg-slate-50 text-xs font-bold uppercase border-b">{r.nombre} (T{r.torre.slice(-1)}-{r.apartamento})</button>
                    ))}
                  </div>
                )}
              </div>
              <input className="w-full bg-slate-50 border p-4 rounded-xl font-bold uppercase" placeholder="Concepto (Ej: MULTA CONVIVENCIA)" onChange={(e) => setFormManual({ ...formManual, concepto: e.target.value })} required />
              <div className="grid grid-cols-2 gap-2">
                <input type="month" className="bg-slate-50 border p-4 rounded-xl font-bold" value={formManual.mes} onChange={(e) => setFormManual({ ...formManual, mes: e.target.value })} />
                <input type="number" className="bg-rose-50 border border-rose-100 p-4 rounded-xl font-black text-rose-600" placeholder="Monto" onChange={(e) => setFormManual({ ...formManual, valor: e.target.value })} required />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform">GUARDAR CARGO</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}