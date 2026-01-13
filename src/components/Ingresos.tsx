"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ReciboCaja from "./ReciboCaja";
import {
  Search, User, Wallet, Loader2, X, Receipt, ArrowRight,
  Landmark, Banknote, Info, Hash, CheckCircle2, ChevronRight
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
    referencia: ""
  });

  const [abonos, setAbonos] = useState<any>({});

  useEffect(() => { cargarResidentes(); }, []);

  async function cargarResidentes() {
    const { data } = await supabase.from("residentes").select("*").order('torre', { ascending: true });
    if (data) setResidentes(data);
    setLoading(false);
  }

  // --- NÚMERO DE RECIBO AUTOMÁTICO ---
  async function sugerirSiguienteRecibo() {
    const { data } = await supabase
      .from("pagos")
      .select("numero_recibo")
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const ultimo = data[0].numero_recibo.replace(/\D/g, "");
      const siguiente = (parseInt(ultimo) || 0) + 1;
      setFormRecibo(prev => ({ ...prev, numero: siguiente.toString() }));
    } else {
      setFormRecibo(prev => ({ ...prev, numero: "1" }));
    }
  }

  async function cargarDeudasResidente(res: any) {
    setResSeleccionado(res);
    setBusqueda("");
    const { data } = await supabase
      .from("deudas_residentes")
      .select(`*, causaciones_globales(mes_causado, concepto_nombre)`)
      .eq("residente_id", res.id)
      .gt("saldo_pendiente", 0);

    if (data) {
      setDeudas(data);
      const initialAbonos: any = {};
      data.forEach((d: any) => initialAbonos[d.id] = 0);
      setAbonos(initialAbonos);
    }
    await sugerirSiguienteRecibo();
  }

  // --- LÓGICA DE SALDO REAL DINÁMICO (Tramo Fecha - Abonos Anteriores) ---
  const calcularSaldoRealHoy = (deuda: any) => {
    if (!deuda.causaciones_globales) return deuda.saldo_pendiente || 0;
    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const [yC, mC] = deuda.causaciones_globales.mes_causado.split("-").map(Number);

    let precioBaseTramo = deuda.precio_m1 || 0;
    if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
      precioBaseTramo = deuda.precio_m3 || 0;
    } else {
      if (dia > 10 && dia <= 20) precioBaseTramo = deuda.precio_m2 || 0;
      if (dia > 20) precioBaseTramo = deuda.precio_m3 || 0;
    }
    
    const yaPagadoPrevio = (deuda.precio_m1 || 0) - (deuda.saldo_pendiente || 0);
    return Math.max(0, precioBaseTramo - yaPagadoPrevio);
  };

  const totalAPagarRecibo = Object.values(abonos).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
  const totalDeudaAcumulada = deudas.reduce((acc, d) => acc + calcularSaldoRealHoy(d), 0);

  async function procesarPago() {
    if (totalAPagarRecibo <= 0 || !formRecibo.numero) return alert("Verifica el Nº de recibo y montos.");
    setProcesando(true);

    try {
      const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      
      const conceptoTextoParaDB = deudas
        .filter(d => Number(abonos[d.id]) > 0)
        .map(d => {
          const [anio, mes] = d.causaciones_globales.mes_causado.split("-");
          const mNom = mesesNombres[parseInt(mes) - 1];
          return `${d.causaciones_globales.concepto_nombre} (${mNom} ${anio})`;
        })
        .join(", ");

      const { error: errP } = await supabase.from("pagos").insert([{
        residente_id: resSeleccionado.id,
        unidad: `${resSeleccionado.torre.replace("Torre ", "T")}-${resSeleccionado.apartamento}`,
        numero_recibo: formRecibo.numero,
        monto_total: totalAPagarRecibo,
        fecha_pago: formRecibo.fecha,
        metodo_pago: formRecibo.metodo,
        comprobante: formRecibo.referencia.toUpperCase(),
        concepto_texto: conceptoTextoParaDB
      }]);
      if (errP) throw errP;

      for (const dId in abonos) {
        const valorAbono = Number(abonos[dId]);
        if (valorAbono > 0) {
          const original = deudas.find(d => d.id === Number(dId));
          const result = Math.max(0, (original.saldo_pendiente || 0) - valorAbono);
          await supabase.from("deudas_residentes").update({ saldo_pendiente: result }).eq("id", dId);
        }
      }

      setDatosRecibo({
        numero: formRecibo.numero, fecha: formRecibo.fecha,
        nombre: resSeleccionado.nombre, unidad: `${resSeleccionado.torre.replace("Torre ","T")}-${resSeleccionado.apartamento}`,
        valor: totalAPagarRecibo, concepto: conceptoTextoParaDB,
        metodo: formRecibo.metodo, comprobante: formRecibo.referencia,
        saldoAnterior: totalDeudaAcumulada, email: resSeleccionado.email
      });

      setResSeleccionado(null);
      setDeudas([]);
    } catch (e: any) { alert(e.message); }
    finally { setProcesando(false); }
  }

  // Filtrado 5-101 o Nombre
  const filteredRes = busqueda.length > 0 ? residentes.filter(r => {
    const term = busqueda.toLowerCase();
    const unidadId = `${r.torre.replace("Torre ","")}-${r.apartamento}`;
    return r.nombre.toLowerCase().includes(term) || unidadId.includes(term);
  }).slice(0, 4) : [];

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0">
      
      {datosRecibo && <ReciboCaja datos={datosRecibo} onClose={() => setDatosRecibo(null)} />}

      {/* 1. BUSCADOR INTELIGENTE */}
      <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative z-[100]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-4 rounded-lg outline-none font-bold text-slate-700 focus:bg-white transition-all"
            placeholder="Escribe Apto (Ej: 5-101) o Nombre..."
            value={resSeleccionado ? `${resSeleccionado.nombre} | ${resSeleccionado.torre.replace("Torre ","T")}-${resSeleccionado.apartamento}` : busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setResSeleccionado(null); }}
          />
          {resSeleccionado && <button onClick={()=>setResSeleccionado(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500"><X size={18}/></button>}
        </div>

        {filteredRes.length > 0 && (
          <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
             {filteredRes.map(r => (
               <button key={r.id} onClick={() => cargarDeudasResidente(r)} className="w-full p-4 text-left border-b border-slate-50 hover:bg-slate-50 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs uppercase">{r.torre.charAt(r.torre.length-1)}</div>
                     <div><p className="font-bold text-sm text-slate-800 uppercase">{r.nombre}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.torre} - {r.apartamento}</p></div>
                  </div>
                  <ChevronRight size={14} className="text-slate-200 group-hover:text-emerald-500" />
               </button>
             ))}
          </div>
        )}
      </section>

      {resSeleccionado && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500">
          
          {/* TABLA DE DEUDAS (PC Y MÓVIL) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
               <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between uppercase">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest flex items-center gap-2"><Wallet size={12}/> Pendientes del Propietario</span>
                  <span className="text-[10px] font-bold text-emerald-600">Al día: ${totalDeudaAcumulada.toLocaleString('es-CO')}</span>
               </div>
               
               {/* VERSION PC: TABLE */}
               <div className="hidden md:block">
                  <table className="w-full text-left">
                     <thead>
                       <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/20">
                          <th className="p-6">Obligación / Mes</th>
                          <th className="p-6 text-right">Saldo Hoy</th>
                          <th className="p-6 text-center">Aplicar Abono</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {deudas.map(d => {
                          const sHoy = calcularSaldoRealHoy(d);
                          return (
                            <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="p-6"><p className="text-slate-800 font-black text-sm">{d.causaciones_globales?.concepto_nombre}</p><p className="text-[10px] text-slate-400 font-bold">{d.causaciones_globales.mes_causado}</p></td>
                               <td className="p-6 text-right"><span className="text-slate-900 font-black tabular-nums">${sHoy.toLocaleString()}</span></td>
                               <td className="p-6">
                                  <div className="relative w-40 mx-auto">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black">$</span>
                                    <input type="number" className="w-full bg-white border border-slate-200 p-3 pl-8 rounded-xl text-right font-black outline-none focus:border-emerald-500 shadow-sm" value={abonos[d.id] || ""} onChange={(e)=>setAbonos({...abonos, [d.id]: e.target.value})}/>
                                  </div>
                               </td>
                            </tr>
                          )
                        })}
                     </tbody>
                  </table>
               </div>

               {/* VERSION MOVIL: CARDS */}
               <div className="md:hidden divide-y divide-slate-100">
                  {deudas.map(d => (
                    <div key={d.id} className="p-5 flex flex-col gap-4">
                       <div className="flex justify-between items-start">
                          <div><p className="font-black text-slate-900 text-xs uppercase">{d.causaciones_globales?.concepto_nombre}</p><p className="text-[10px] font-bold text-slate-400">{d.causaciones_globales.mes_causado}</p></div>
                          <p className="text-right font-black text-slate-700">${calcularSaldoRealHoy(d).toLocaleString()}</p>
                       </div>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black">$</span>
                          <input type="number" placeholder="Cuanto va a pagar..." className="w-full bg-slate-50 border border-slate-100 p-4 pl-8 rounded-xl text-right font-black outline-none" value={abonos[d.id] || ""} onChange={(e)=>setAbonos({...abonos, [d.id]: e.target.value})}/>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg"><p className="text-emerald-100 text-[9px] font-black uppercase mb-1">Entrada a Caja</p><h4 className="text-3xl font-black tabular-nums">${totalAPagarRecibo.toLocaleString()}</h4></div>
               <div className="bg-slate-900 p-6 rounded-2xl text-white"><p className="text-slate-400 text-[9px] font-black uppercase mb-1">Mora Restante</p><h4 className="text-3xl font-black tabular-nums opacity-60">${Math.max(0, totalDeudaAcumulada - totalAPagarRecibo).toLocaleString()}</h4></div>
            </div>
          </div>

          {/* FICHA TÉCNICA DEL RECIBO (DERECHA) */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <div className="flex justify-between border-b border-slate-100 pb-5">
                  <h3 className="font-black text-slate-800 text-sm uppercase">Trámite de Recaudo</h3>
                  <Receipt className="text-slate-200" size={16}/>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Comprobante RC</label>
                     <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-black text-slate-900" value={formRecibo.numero} onChange={(e)=>setFormRecibo({...formRecibo, numero: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Recibo</label>
                     <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold" value={formRecibo.fecha} onChange={(e)=>setFormRecibo({...formRecibo, fecha: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Medio / Referencia</label>
                     <div className="flex bg-slate-100 p-1 rounded-xl mb-2 gap-1">
                        {['Transferencia', 'Efectivo'].map(m => (
                          <button key={m} onClick={()=>setFormRecibo({...formRecibo, metodo: m})} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${formRecibo.metodo === m ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400"}`}>{m.toUpperCase()}</button>
                        ))}
                     </div>
                     <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold" placeholder="Escribe Ref Bancaria (Opcional)" value={formRecibo.referencia} onChange={(e)=>setFormRecibo({...formRecibo, referencia: e.target.value})} />
                  </div>
               </div>

               <button 
                  onClick={procesarPago} 
                  disabled={procesando || totalAPagarRecibo <= 0} 
                  className="w-full bg-emerald-600 text-white font-black py-6 rounded-2xl shadow-xl shadow-emerald-200/40 uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-30"
               >
                  {procesando ? <Loader2 className="animate-spin mx-auto"/> : "Generar y Guardar Pago"}
               </button>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex gap-4">
               <div className="w-1.5 h-auto bg-amber-400 rounded-full"></div>
               <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">Una vez procesado el abono, no se podrán realizar correcciones sin soporte de eliminación manual.</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}