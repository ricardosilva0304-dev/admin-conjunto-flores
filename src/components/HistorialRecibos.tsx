"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, Printer, FileText, Loader2, Hash,
  ChevronDown, ChevronRight, FolderOpen, Folder,
  Calendar, DollarSign, User
} from "lucide-react";
import ReciboCaja from "./ReciboCaja";

export default function HistorialRecibos() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [reciboSeleccionado, setReciboSeleccionado] = useState<any>(null);

  // Estado para controlar qué carpetas están abiertas (Array de IDs de residentes)
  const [carpetasAbiertas, setCarpetasAbiertas] = useState<number[]>([]);

  useEffect(() => { cargarPagos(); }, []);

  async function cargarPagos() {
    setLoading(true);
    const { data } = await supabase
      .from("pagos")
      .select(`*, residentes (id, nombre, torre, apartamento, email)`)
      .order('created_at', { ascending: false });

    if (data) setPagos(data);
    setLoading(false);
  }

  const toggleCarpeta = (id: number) => {
    if (carpetasAbiertas.includes(id)) {
      setCarpetasAbiertas(carpetasAbiertas.filter(c => c !== id));
    } else {
      setCarpetasAbiertas([...carpetasAbiertas, id]);
    }
  };

  // --- LÓGICA DE AGRUPACIÓN Y ORDENAMIENTO ---
  const gruposFiltrados = useMemo(() => {
    // 1. Agrupar pagos por Residente
    const grupos: any = {};

    pagos.forEach(p => {
      // Filtro de búsqueda
      const term = busqueda.toLowerCase().trim();
      const unidad = p.unidad?.toLowerCase() || "";
      const nombre = p.residentes?.nombre?.toLowerCase() || "";
      const recibo = p.numero_recibo?.toLowerCase() || "";

      const termNorm = term.replace("-", "");
      const unidadNorm = unidad.replace(/[^0-9]/g, "");
      const coincide = unidad.includes(term) || nombre.includes(term) || recibo.includes(term)
        || (termNorm.length >= 3 && unidadNorm.includes(termNorm));

      if (coincide && p.residentes) {
        const idRes = p.residentes.id;
        if (!grupos[idRes]) {
          grupos[idRes] = {
            info: p.residentes,
            pagos: [],
            totalHistorico: 0
          };
        }
        grupos[idRes].pagos.push(p);
        grupos[idRes].totalHistorico += Number(p.monto_total);
      }
    });

    // 2. Convertir a Array y Ordenar por Ubicación (Torre -> Apto)
    return Object.values(grupos).sort((a: any, b: any) => {
      const torreA = a.info.torre || "";
      const torreB = b.info.torre || "";

      if (torreA < torreB) return -1;
      if (torreA > torreB) return 1;

      // Si es la misma torre, por apartamento numérico
      return parseInt(a.info.apartamento) - parseInt(b.info.apartamento);
    });

  }, [pagos, busqueda]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans text-slate-800">

      {/* 1. CABECERA Y BUSCADOR */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-widest text-slate-800">Archivo Digital</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Historial por Unidades</p>
          </div>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Buscar carpeta (Ej: 5-101)..."
            className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-bold text-slate-700 text-xs"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </section>

      {/* 2. LISTADO DE CARPETAS */}
      <div className="space-y-4">
        {gruposFiltrados.length === 0 ? (
          <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
            <FolderOpen className="mx-auto text-slate-200 mb-2" size={40} />
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No se encontraron expedientes</p>
          </div>
        ) : (
          (gruposFiltrados as any[]).map((grupo) => {
            const abierto = carpetasAbiertas.includes(grupo.info.id);

            return (
              <div key={grupo.info.id} className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${abierto ? 'border-emerald-500 shadow-lg ring-1 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-300'}`}>

                {/* CABECERA DE LA CARPETA (Click para abrir) */}
                <button
                  onClick={() => toggleCarpeta(grupo.info.id)}
                  className="w-full p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left bg-gradient-to-r from-white to-slate-50/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${abierto ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {abierto ? <FolderOpen size={24} /> : <Folder size={24} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        T{grupo.info.torre.replace("Torre ", "")}-{grupo.info.apartamento}
                        <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full">{grupo.pagos.length} Recibos</span>
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 flex items-center gap-1">
                        <User size={10} /> {grupo.info.nombre}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pl-16 md:pl-0">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Histórico</p>
                      <p className="text-lg font-black text-emerald-600 tabular-nums">${grupo.totalHistorico.toLocaleString()}</p>
                    </div>
                    <div className={`transition-transform duration-300 ${abierto ? 'rotate-180 text-emerald-500' : 'text-slate-300'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </button>

                {/* CONTENIDO DE LA CARPETA (Lista de Recibos) */}
                {abierto && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-2 animate-in slide-in-from-top-2">
                    {grupo.pagos.map((p: any) => (
                      <div key={p.id} className="bg-white border border-slate-100 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-all group">

                        <div className="flex items-center gap-4 w-full md:w-auto mb-3 md:mb-0">
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors border border-slate-100">
                            <Hash size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">Recibo #{p.numero_recibo}</p>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Calendar size={10} /> {p.fecha_pago}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{p.metodo_pago}</span>
                            <span className="text-sm font-black text-emerald-600 tabular-nums">${Number(p.monto_total).toLocaleString()}</span>
                          </div>

                          <button
                            onClick={() => setReciboSeleccionado(p)}
                            className="bg-white border border-slate-200 text-slate-400 p-2.5 rounded-lg hover:bg-slate-900 hover:text-white transition-colors shadow-sm"
                            title="Ver Recibo"
                          >
                            <Printer size={16} />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE REIMPRESIÓN */}
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
            saldoAnterior: reciboSeleccionado.saldo_anterior || reciboSeleccionado.monto_total,
            email: reciboSeleccionado.residentes?.email
          }}
          onClose={() => setReciboSeleccionado(null)}
        />
      )}

    </div>
  );
}