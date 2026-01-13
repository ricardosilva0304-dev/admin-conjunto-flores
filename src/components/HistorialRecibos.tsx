"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Calendar, Printer, FileText, 
  Loader2, Hash, ArrowRight, User, Banknote
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
    const { data } = await supabase
      .from("pagos")
      .select(`*, residentes (nombre, email)`)
      .order('created_at', { ascending: false });

    if (data) setPagos(data);
    setLoading(false);
  }

  // Filtrado inteligente (Soporta 7-302 o Nombre)
  const filtrados = pagos.filter(p => {
    const term = busqueda.toLowerCase().trim();
    const unidad = p.unidad?.toLowerCase() || "";
    const nombre = p.residentes?.nombre?.toLowerCase() || "";
    
    if (term.includes("-")) {
      const [t, a] = term.split("-");
      return unidad.includes(t) && unidad.includes(a);
    }
    return unidad.includes(term) || nombre.includes(term) || p.numero_recibo.toLowerCase().includes(term);
  });

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans">
      
      {/* 1. BARRA DE HERRAMIENTAS PREMIUM */}
      <section className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-3 px-3 flex-1">
           <FileText size={18} className="text-slate-400" />
           <h2 className="text-slate-800 font-bold text-sm uppercase tracking-tight hidden sm:block">Archivo Recaudos</h2>
        </div>

        <div className="relative w-full md:w-2/3 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text"
            placeholder="Buscar por unidad (7-302), propietario o recibo..."
            className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-4 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-medium text-slate-700 shadow-inner md:shadow-none"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </section>

      {/* 2. LISTADO DE RECIBOS (REDISEÑO MÓVIL Y DESKTOP) */}
      <div className="space-y-2">
        {filtrados.length === 0 ? (
          <div className="py-20 text-center bg-white border border-slate-100 rounded-2xl italic text-slate-400">No se encontraron registros de pago.</div>
        ) : (
          filtrados.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 p-4 md:px-8 md:py-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-all group">
              
              {/* Bloque Identificador y Nombre */}
              <div className="flex items-center gap-5 md:w-2/5">
                <div className="w-14 h-12 bg-slate-900 text-white rounded-lg flex flex-col items-center justify-center shadow-lg border border-white/5">
                   <span className="text-[7px] font-black text-emerald-400 uppercase leading-none mb-1 tracking-tighter">RECIBO</span>
                   <span className="text-sm font-black italic tracking-tighter">#{p.numero_recibo.replace(/\D/g, '')}</span>
                </div>
                <div className="truncate min-w-0">
                  <h4 className="text-slate-900 font-bold text-sm uppercase truncate leading-tight mb-1">{p.residentes?.nombre}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 text-[10px] font-black flex items-center gap-1 uppercase tracking-wider">
                      <Hash size={10}/> T{p.unidad}
                    </span>
                    <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1 italic">
                      <Calendar size={10}/> {p.fecha_pago}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque Dinero y Método (Elegante y Centralizado) */}
              <div className="flex items-center justify-between md:justify-center gap-6 py-4 md:py-0 px-0 md:px-10 border-t md:border-t-0 md:border-x border-slate-100 mt-2 md:mt-0">
                 <div className="flex flex-col md:items-end">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Ingreso</p>
                    <span className="text-emerald-600 font-black text-xl tabular-nums tracking-tighter">${p.monto_total?.toLocaleString()}</span>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Medio</p>
                    <span className="text-slate-900 font-bold text-[9px] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-tighter">{p.metodo_pago}</span>
                 </div>
              </div>

              {/* Bloque Acción - El botón es un cuadrado cómodo para celular */}
              <div className="flex md:pl-8">
                <button 
                  onClick={() => setReciboSeleccionado(p)}
                  className="w-full md:w-auto bg-slate-50 border border-slate-200 p-4 md:p-3 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-3"
                >
                  <Printer size={18} />
                  <span className="text-[10px] font-black uppercase md:hidden tracking-widest">Reimprimir Recibo</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL DE REIMPRESIÓN (VINCULADO AL RECIBO PREMIUM) */}
      {reciboSeleccionado && (
        <ReciboCaja
          datos={{
            numero: reciboSeleccionado.numero_recibo,
            fecha: reciboSeleccionado.fecha_pago,
            nombre: reciboSeleccionado.residentes?.nombre || "N/A",
            unidad: reciboSeleccionado.unidad,
            valor: reciboSeleccionado.monto_total,
            concepto: reciboSeleccionado.concepto_texto || "GESTIÓN CARTERA (RESUMEN)",
            metodo: reciboSeleccionado.metodo_pago,
            comprobante: reciboSeleccionado.comprobante,
            saldoAnterior: reciboSeleccionado.monto_total, // Mostramos lo pagado como referencia anterior
            email: reciboSeleccionado.residentes?.email
          }}
          onClose={() => setReciboSeleccionado(null)}
        />
      )}

      {/* PIE DE ARCHIVO */}
      <div className="pt-6 border-t border-slate-100 text-center">
         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Cierre Diario de Operaciones de Caja</p>
      </div>

    </div>
  );
}