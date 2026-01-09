"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ReciboCaja from "./ReciboCaja";
import {
  Search, User, Wallet, Calendar, Hash,
  CheckCircle2, Loader2, X, Receipt, ArrowRight,
  Landmark, Banknote, Info
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
    const { data } = await supabase.from("residentes").select("*");
    if (data) setResidentes(data);
    setLoading(false);
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

  const calcularSaldoRealHoy = (deuda: any) => {
    if (!deuda.causaciones_globales) return deuda.saldo_pendiente || 0;
    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const [yC, mC] = deuda.causaciones_globales.mes_causado.split("-").map(Number);

    let precioTotalMes = deuda.precio_m1 || 0;
    if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
      precioTotalMes = deuda.precio_m3 || 0;
    } else {
      if (dia > 10 && dia <= 20) precioTotalMes = deuda.precio_m2 || 0;
      if (dia > 20) precioTotalMes = deuda.precio_m3 || 0;
    }
    const yaPagado = (deuda.precio_m1 || 0) - (deuda.saldo_pendiente || 0);
    return Math.max(0, precioTotalMes - yaPagado);
  };

  const totalAPagarRecibo = Object.values(abonos).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
  const totalDeudaHoy = deudas.reduce((acc, d) => acc + calcularSaldoRealHoy(d), 0);

  async function procesarPago() {
    if (totalAPagarRecibo <= 0 || !formRecibo.numero) return alert("Llena los datos.");
    setProcesando(true);

    try {
      const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

      const textoParaDB = deudas
        .filter(d => Number(abonos[d.id]) > 0)
        .map(d => {
          const [anio, mes] = d.causaciones_globales.mes_causado.split("-");
          const mesNombre = mesesNombres[parseInt(mes) - 1];
          const nombreC = d.causaciones_globales.concepto_nombre || "ADMINISTRACIÓN";
          return `${nombreC} (${mesNombre} ${anio})`;
        })
        .join(", ");

      // --- CORRECCIÓN DE ERROR 'errR already declared' ---
      const { error: errPago } = await supabase.from("pagos").insert([{
        residente_id: resSeleccionado.id,
        unidad: `${resSeleccionado.torre.replace("Torre ", "T")}-${resSeleccionado.apartamento}`,
        numero_recibo: formRecibo.numero,
        monto_total: totalAPagarRecibo,
        fecha_pago: formRecibo.fecha,
        metodo_pago: formRecibo.metodo,
        comprobante: formRecibo.referencia,
        concepto_texto: textoParaDB
      }]);

      if (errPago) throw errPago;

      for (const deudaId in abonos) {
        const montoAbono = Number(abonos[deudaId]);
        if (montoAbono > 0) {
          const dOrig = deudas.find(d => d.id === Number(deudaId));
          const nuevoSaldo = Math.max(0, (dOrig.saldo_pendiente || 0) - montoAbono);
          // Usamos errUpdate para no repetir nombres
          const { error: errUpdate } = await supabase.from("deudas_residentes").update({ saldo_pendiente: nuevoSaldo }).eq("id", deudaId);
          if (errUpdate) throw errUpdate;
        }
      }

      setDatosRecibo({
        numero: formRecibo.numero,
        fecha: formRecibo.fecha,
        nombre: resSeleccionado.nombre,
        unidad: `${resSeleccionado.torre.replace("Torre ", "T")}-${resSeleccionado.apartamento}`,
        valor: totalAPagarRecibo,
        concepto: textoParaDB,
        metodo: formRecibo.metodo,
        comprobante: formRecibo.referencia,
        saldoAnterior: totalDeudaHoy,
        email: resSeleccionado.email
      });

      setResSeleccionado(null);
      setDeudas([]);
      setFormRecibo({ ...formRecibo, numero: "", referencia: "" });

    } catch (e: any) { alert(e.message); }
    finally { setProcesando(false); }
  }

  // Función para encontrar el número de recibo más alto y sugerir el siguiente
  async function sugerirSiguienteRecibo() {
    const { data, error } = await supabase
      .from("pagos")
      .select("numero_recibo")
      .order("created_at", { ascending: false }) // Buscamos el último creado
      .limit(1);

    if (data && data.length > 0) {
      // Extraemos solo los números (por si acaso el recibo tiene letras como "RC-1")
      const ultimoNumeroStr = data[0].numero_recibo.replace(/\D/g, "");
      const siguiente = parseInt(ultimoNumeroStr) + 1;
      setFormRecibo(prev => ({ ...prev, numero: siguiente.toString() }));
    } else {
      // Si no hay ningún recibo en la base de datos (está vacío)
      setFormRecibo(prev => ({ ...prev, numero: "1" }));
    }
  }

  const sugerencias = busqueda.length > 0 ? residentes.filter(r => {
    const term = busqueda.toLowerCase();
    const unidad = `${r.torre.replace("Torre ", "")}-${r.apartamento}`;
    return unidad.includes(term) || r.nombre.toLowerCase().includes(term);
  }).slice(0, 5) : [];

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {datosRecibo && <ReciboCaja datos={datosRecibo} onClose={() => setDatosRecibo(null)} />}

      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative z-30">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">Seleccionar Residente</label>
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
          <input
            type="text"
            placeholder="Buscar por unidad (ej: 5-101) o nombre..."
            className="w-full bg-slate-50 border border-slate-100 pl-16 pr-8 py-6 rounded-[2rem] outline-none focus:ring-4 ring-emerald-500/5 focus:border-emerald-500 font-bold text-lg text-slate-700 transition-all"
            value={resSeleccionado ? `${resSeleccionado.torre} - Apto ${resSeleccionado.apartamento} | ${resSeleccionado.nombre}` : busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setResSeleccionado(null); }}
          />
          {resSeleccionado && <button onClick={() => setResSeleccionado(null)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X /></button>}
        </div>

        {sugerencias.length > 0 && (
          <div className="absolute top-[85%] left-10 right-10 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 z-50">
            {sugerencias.map(r => (
              <button key={r.id} onClick={() => cargarDeudasResidente(r)} className="w-full p-6 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors">
                <div><p className="font-black text-slate-900">{r.nombre}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.torre} - {r.apartamento}</p></div>
                <ArrowRight className="text-emerald-500" size={18} />
              </button>
            ))}
          </div>
        )}
      </section>

      {resSeleccionado && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4"><Wallet className="text-emerald-600" /><h3 className="text-slate-900 font-black uppercase tracking-tight">Deudas Pendientes</h3></div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-4">Concepto / Mes</th>
                    <th className="px-8 py-4 text-right">Saldo Hoy</th>
                    <th className="px-8 py-4 text-center">Abonar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {deudas.length === 0 ? (
                    <tr><td colSpan={3} className="p-12 text-center text-slate-300 italic font-bold uppercase text-xs">Sin deudas pendientes</td></tr>
                  ) : (
                    deudas.map(d => {
                      const saldoHoy = calcularSaldoRealHoy(d);
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="text-slate-900 font-black text-sm uppercase">{d.causaciones_globales?.concepto_nombre || "ADMINISTRACIÓN"}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{d.causaciones_globales.mes_causado}</p>
                          </td>
                          <td className="px-8 py-6 text-right"><span className="text-slate-900 font-black tabular-nums text-lg">${saldoHoy.toLocaleString('es-CO')}</span></td>
                          <td className="px-8 py-6">
                            <div className="relative max-w-[160px] mx-auto">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                              <input type="number" className="w-full bg-white border-2 border-slate-100 pl-10 pr-4 py-3 rounded-2xl text-right font-black text-slate-700 outline-none focus:border-emerald-500" placeholder="0" value={abonos[d.id] || ""} onChange={(e) => setAbonos({ ...abonos, [d.id]: e.target.value })} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100"><p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest mb-1">Total Recibo</p><h4 className="text-4xl font-black tabular-nums tracking-tighter">${totalAPagarRecibo.toLocaleString('es-CO')}</h4></div>
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200"><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Restante Proyectado</p><h4 className="text-4xl font-black tabular-nums tracking-tighter opacity-50">${Math.max(0, totalDeudaHoy - totalAPagarRecibo).toLocaleString('es-CO')}</h4></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-4"><Receipt className="text-emerald-500" /><h3 className="text-slate-900 font-black uppercase tracking-tight">Detalles Pago</h3></div>
              <div className="space-y-4">
                <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700" placeholder="Nº Recibo Caja" value={formRecibo.numero} onChange={(e) => setFormRecibo({ ...formRecibo, numero: e.target.value })} />
                <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700" value={formRecibo.fecha} onChange={(e) => setFormRecibo({ ...formRecibo, fecha: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  {[{ id: 'Transferencia', icon: <Landmark size={14} /> }, { id: 'Efectivo', icon: <Banknote size={14} /> }].map(m => (
                    <button key={m.id} type="button" onClick={() => setFormRecibo({ ...formRecibo, metodo: m.id })} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black transition-all ${formRecibo.metodo === m.id ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>{m.icon} {m.id.toUpperCase()}</button>
                  ))}
                </div>
                <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700" placeholder="Comprobante..." value={formRecibo.referencia} onChange={(e) => setFormRecibo({ ...formRecibo, referencia: e.target.value })} />
              </div>
              <button onClick={procesarPago} disabled={procesando || totalAPagarRecibo <= 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-30">{procesando ? <Loader2 className="animate-spin mx-auto" /> : "PROCESAR RECIBO"}</button>
            </div>
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4"><Info className="text-amber-500 shrink-0" size={20} /><p className="text-[10px] text-amber-700 font-bold leading-relaxed">El abono se aplicará a cada saldo de deuda de forma automática.</p></div>
          </div>
        </div>
      )}
    </div>
  );
}