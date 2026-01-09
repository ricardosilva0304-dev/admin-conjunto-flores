"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, Calendar, Printer, FileText,
  Loader2, Filter, ArrowUpRight, User, Hash
} from "lucide-react";
import ReciboCaja from "./ReciboCaja";

export default function HistorialRecibos() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [reciboSeleccionado, setReciboSeleccionado] = useState<any>(null);

  useEffect(() => { cargarPagos(); }, []);

  async function cargarPagos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pagos")
      .select(`
      *,
      residentes (nombre, email)
    `) // El * ya trae el concepto_texto si existe
      .order('created_at', { ascending: false });

    if (data) setPagos(data);
    setLoading(false);
  }

  // Lógica de filtrado inteligente (7-302 o Nombre)
  const pagosFiltrados = pagos.filter(p => {
    const term = busqueda.toLowerCase().trim();
    const unidad = p.unidad?.toLowerCase() || "";
    const nombre = p.residentes?.nombre?.toLowerCase() || "";

    if (term.includes("-")) {
      const [t, a] = term.split("-");
      return unidad.includes(t) && unidad.includes(a);
    }
    return unidad.includes(term) || nombre.includes(term) || p.numero_recibo.includes(term);
  });

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">

      {/* MODAL DE RE-IMPRESIÓN */}
      {reciboSeleccionado && (
        <ReciboCaja
          datos={{
            numero: reciboSeleccionado.numero_recibo,
            fecha: reciboSeleccionado.fecha_pago,
            nombre: reciboSeleccionado.residentes?.nombre || "N/A",
            unidad: reciboSeleccionado.unidad,
            valor: reciboSeleccionado.monto_total,
            // CORRECCIÓN: Si el campo está vacío (recibos viejos), ponemos un texto por defecto
            concepto: reciboSeleccionado.concepto_texto || "PAGO REGISTRADO EN SISTEMA",
            metodo: reciboSeleccionado.metodo_pago,
            comprobante: reciboSeleccionado.comprobante,
            saldoAnterior: reciboSeleccionado.monto_total, // En historial mostramos el valor pagado
            email: reciboSeleccionado.residentes?.email
          }}
          onClose={() => setReciboSeleccionado(null)}
        />
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <FileText size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Archivo Financiero</span>
          </div>
          <h1 className="text-slate-900 text-4xl font-black tracking-tight">Historial de Recibos</h1>
        </div>

        {/* BUSCADOR */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por Unidad (5-101), Nombre o Recibo..."
            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-4 ring-emerald-500/5 focus:border-emerald-500 transition-all font-bold text-slate-700"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* LISTADO DE PAGOS */}
      <div className="space-y-3 pb-20">
        {pagosFiltrados.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest italic">No se encontraron recibos</p>
          </div>
        ) : (
          pagosFiltrados.map((p) => (
            <div key={p.id} className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">

              {/* Info Principal */}
              <div className="flex items-center gap-6 w-1/2">
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <span className="text-[10px] font-black uppercase opacity-50">RC</span>
                  <span className="text-sm font-black tracking-tighter">{p.numero_recibo.replace(/\D/g, '')}</span>
                </div>
                <div className="truncate">
                  <h4 className="text-slate-900 font-black text-base truncate">{p.residentes?.nombre}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Hash size={10} /> {p.unidad}
                    </span>
                    <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1">
                      <Calendar size={10} /> {p.fecha_pago}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monto y Método */}
              <div className="flex items-center gap-10 px-8 border-x border-slate-50">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Pagado</p>
                  <span className="text-emerald-600 font-black text-lg tabular-nums">${p.monto_total.toLocaleString()}</span>
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Método</p>
                  <span className="text-slate-900 font-bold text-[10px] bg-slate-100 px-3 py-1 rounded-full uppercase">{p.metodo_pago}</span>
                </div>
              </div>

              {/* Acción */}
              <div className="pl-6">
                <button
                  onClick={() => setReciboSeleccionado(p)}
                  className="bg-slate-900 hover:bg-emerald-600 text-white p-4 rounded-xl transition-all shadow-lg active:scale-95 group/btn"
                >
                  <Printer size={18} className="group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}