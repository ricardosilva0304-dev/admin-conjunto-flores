"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import ReciboCaja from "./ReciboCaja";
import { calcularValorDeudaHoy } from "@/lib/utils"; // Importamos lógica central
import {
  Search, User, Wallet, Loader2, X, Receipt,
  Landmark, Banknote, ChevronRight
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

  async function sugerirSiguienteRecibo() {
    const { data } = await supabase
      .from("pagos")
      .select("numero_recibo")
      .order("created_at", { ascending: false }) // Buscamos por creación para eficiencia
      .limit(10); // Miramos los últimos 10 por si hay huecos

    if (data && data.length > 0) {
       // Extraemos solo los números y buscamos el máximo real
       const numeros = data.map(p => parseInt(p.numero_recibo.replace(/\D/g, "")) || 0);
       const maximo = Math.max(...numeros);
       setFormRecibo(prev => ({ ...prev, numero: (maximo + 1).toString() }));
    } else {
      setFormRecibo(prev => ({ ...prev, numero: "1" }));
    }
  }

  async function cargarDeudasResidente(res: any) {
    setResSeleccionado(res);
    setBusqueda("");
    const { data } = await supabase
      .from("deudas_residentes")
      .select(`
        *, 
        causaciones_globales(id, mes_causado, concepto_nombre, tipo_cobro)
      `)
      .eq("residente_id", res.id)
      .neq("saldo_pendiente", 0);

    if (data) {
      setDeudas(data);
      const initialAbonos: any = {};
      data.forEach((d: any) => initialAbonos[d.id] = 0);
      setAbonos(initialAbonos);
    }
    await sugerirSiguienteRecibo();
  }

  // --- CÁLCULO DE SALDO GLOBAL REAL ---
  const totalDeudaAcumulada = useMemo(() => {
    return deudas.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);
  }, [deudas]);

  const totalAPagarRecibo = deudas.reduce((acc, d) => acc + (Number(abonos[d.id]) || 0), 0);

  async function procesarPago() {
    if (totalAPagarRecibo <= 0 || !formRecibo.numero) return alert("Verifica montos y número de recibo.");
    
    setProcesando(true);
    try {
      // 1. VALIDAR DUPLICADO ANTES DE EMPEZAR
      const { data: existe } = await supabase
        .from("pagos")
        .select("numero_recibo")
        .eq("numero_recibo", formRecibo.numero)
        .single();

      if (existe) {
        alert("⚠️ Este número de recibo ya existe. Por favor usa el siguiente.");
        await sugerirSiguienteRecibo();
        setProcesando(false);
        return;
      }

      // 2. CAPTURAR EL SALDO ANTES DE ACTUALIZAR
      const saldoGlobalAntesDelPago = totalDeudaAcumulada;
      
      const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

      // 3. CONSTRUCCIÓN BLINDADA DEL CONCEPTO
      const conceptoTextoParaDB = deudas
        .filter(d => Number(abonos[d.id]) !== 0)
        .map(d => {
          const montoInd = Number(abonos[d.id]).toLocaleString('es-CO');
          // PRIORIDAD: Causación Global -> Deuda Local -> Default
          const nombreC = d.causaciones_globales?.concepto_nombre || d.concepto_nombre || "ADMINISTRACIÓN";

          let periodo = "";
          const fechaRef = d.causaciones_globales?.mes_causado || d.fecha_vencimiento?.substring(0, 7);
          if (fechaRef) {
            const [anio, mes] = fechaRef.split("-");
            periodo = ` (${mesesNombres[parseInt(mes) - 1]} ${anio})`;
          }
          return `${nombreC}${periodo}|$${montoInd}`;
        }).join("||");

      // 4. GUARDAR EL PAGO
      const { error: errP } = await supabase.from("pagos").insert([{
        residente_id: resSeleccionado.id,
        unidad: `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`,
        numero_recibo: formRecibo.numero,
        monto_total: totalAPagarRecibo,
        fecha_pago: formRecibo.fecha,
        metodo_pago: formRecibo.metodo,
        comprobante: formRecibo.referencia.toUpperCase(),
        concepto_texto: conceptoTextoParaDB,
        saldo_anterior: saldoGlobalAntesDelPago
      }]);

      if (errP) throw errP;

      // 5. ACTUALIZAR SALDOS EN DEUDAS_RESIDENTES
      for (const dId in abonos) {
        const valorAbono = Number(abonos[dId]);
        if (valorAbono !== 0) {
          const original = deudas.find(d => d.id === Number(dId));
          const nuevoSaldo = (Number(original.saldo_pendiente) || 0) - valorAbono;
          await supabase.from("deudas_residentes").update({ saldo_pendiente: nuevoSaldo }).eq("id", dId);
        }
      }

      // 6. DISPARAR LA VISTA DEL RECIBO
      setDatosRecibo({
        numero: formRecibo.numero, fecha: formRecibo.fecha,
        nombre: resSeleccionado.nombre, unidad: `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`,
        valor: totalAPagarRecibo, concepto: conceptoTextoParaDB,
        metodo: formRecibo.metodo, comprobante: formRecibo.referencia,
        saldoAnterior: saldoGlobalAntesDelPago, email: resSeleccionado.email
      });

      setResSeleccionado(null);
      setDeudas([]);
    } catch (e: any) { 
      alert("Error crítico: " + e.message); 
    } finally { 
      setProcesando(false); 
    }
  }

  const filteredRes = busqueda.length > 0 ? residentes.filter(r => {
    const term = busqueda.toLowerCase();
    const unidadId = `${r.torre.replace("Torre ", "")}-${r.apartamento}`;
    return r.nombre.toLowerCase().includes(term) || unidadId.includes(term);
  }).slice(0, 4) : [];

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans">
      {datosRecibo && <ReciboCaja datos={datosRecibo} onClose={() => setDatosRecibo(null)} />}

      {/* BUSCADOR DE UNIDADES */}
      <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative z-[30]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-4 rounded-lg outline-none font-bold text-slate-700 focus:bg-white transition-all"
            placeholder="Escribe Apto (Ej: 5-101) o Nombre..."
            value={resSeleccionado ? `${resSeleccionado.nombre} | T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}` : busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setResSeleccionado(null); }}
          />
          {resSeleccionado && <button onClick={() => setResSeleccionado(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500"><X size={18} /></button>}
        </div>

        {filteredRes.length > 0 && (
          <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-[100]">
            {filteredRes.map(r => (
              <button key={r.id} onClick={() => cargarDeudasResidente(r)} className="w-full p-4 text-left border-b border-slate-50 hover:bg-slate-50 flex items-center justify-between group font-bold text-sm text-slate-600">
                <span>{r.nombre} (T{r.torre.slice(-1)}-{r.apartamento})</span>
                <ChevronRight size={14} className="text-slate-200 group-hover:text-emerald-500" />
              </button>
            ))}
          </div>
        )}
      </section>

      {resSeleccionado && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Cartera</span>
                <span className={`text-[10px] font-bold ${totalDeudaAcumulada < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  DEUDA GLOBAL: ${Math.abs(totalDeudaAcumulada).toLocaleString('es-CO')} {totalDeudaAcumulada < 0 ? 'A FAVOR' : ''}
                </span>
              </div>

              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-100">
                  <tr><th className="p-6">Concepto / Periodo</th><th className="p-6 text-right">Saldo Hoy</th><th className="p-6 text-center">Abonar</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {deudas.map(d => {
                    const sHoy = calcularValorDeudaHoy(d);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="p-6">
                          <p className="text-slate-800 font-black text-sm">{d.causaciones_globales?.concepto_nombre || d.concepto_nombre}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{d.causaciones_globales?.mes_causado || "UNICO"}</p>
                        </td>
                        <td className="p-6 text-right font-black tabular-nums">${sHoy.toLocaleString()}</td>
                        <td className="p-6">
                          <div className="relative w-32 mx-auto">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black">$</span>
                            <input type="number" className="w-full bg-white border border-slate-200 p-3 pl-8 rounded-xl text-right font-black outline-none focus:border-emerald-500" value={abonos[d.id] || ""} onChange={(e) => setAbonos({ ...abonos, [d.id]: e.target.value })} placeholder="0" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg"><p className="text-emerald-100 text-[9px] font-black uppercase mb-1">Total a Recibir</p><h4 className="text-3xl font-black tabular-nums">${totalAPagarRecibo.toLocaleString()}</h4></div>
              <div className="bg-slate-900 p-6 rounded-2xl text-white"><p className="text-slate-400 text-[9px] font-black uppercase mb-1">Nuevo Saldo Est.</p><h4 className="text-3xl font-black tabular-nums opacity-60">${Math.abs(totalDeudaAcumulada - totalAPagarRecibo).toLocaleString()}</h4></div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest border-b pb-4">Detalle de Caja</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">No. Comprobante</label>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-black text-slate-900" value={formRecibo.numero} onChange={(e) => setFormRecibo({ ...formRecibo, numero: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Medio de Pago</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-2 gap-1">
                    {['Transferencia', 'Efectivo'].map(m => (
                      <button key={m} onClick={() => setFormRecibo({ ...formRecibo, metodo: m })} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${formRecibo.metodo === m ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400"}`}>{m.toUpperCase()}</button>
                    ))}
                  </div>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold" placeholder="Referencia Bancaria" value={formRecibo.referencia} onChange={(e) => setFormRecibo({ ...formRecibo, referencia: e.target.value })} />
                </div>
              </div>
              <button onClick={procesarPago} disabled={procesando || totalAPagarRecibo <= 0} className="w-full bg-emerald-600 text-white font-black py-6 rounded-2xl shadow-xl uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-30">
                {procesando ? <Loader2 className="animate-spin mx-auto" /> : "REGISTRAR PAGO"}
              </button>
          </div>
        </div>
      )}
    </div>
  );
}