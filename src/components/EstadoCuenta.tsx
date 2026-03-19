"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy, formatPeriodo } from "@/lib/utils";
import { Printer, X, Loader2, CheckCircle2, History, AlertCircle } from "lucide-react";

interface Props { residente: any; deudas: any[]; onClose: () => void; }

function extraerConceptoBase(nombre: string): string {
  return nombre.replace(/\s*\(.*?\)\s*/g, '').trim();
}

export default function EstadoCuenta({ residente, deudas, onClose }: Props) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPagos = async () => {
      const { data } = await supabase
        .from("pagos").select("*")
        .eq("residente_id", residente.id)
        .order("fecha_pago", { ascending: false });
      if (data) setPagos(data);
      setLoading(false);
    };
    fetchPagos();
  }, [residente]);

  const deudasPendientes = useMemo(() => {
    return deudas
      .filter(d => calcularValorDeudaHoy(d) !== 0)
      .sort((a, b) => {
        const fechaA = a.causaciones_globales?.mes_causado || a.fecha_vencimiento?.substring(0, 7) || "0000-00";
        const fechaB = b.causaciones_globales?.mes_causado || b.fecha_vencimiento?.substring(0, 7) || "0000-00";
        return fechaA.localeCompare(fechaB);
      });
  }, [deudas]);

  // Agrupa por concepto base para mostrar más organizado
  const deudasAgrupadas = useMemo(() => {
    const grupos: Record<string, { concepto: string; items: any[]; total: number }> = {};
    deudasPendientes.forEach(d => {
      const base = extraerConceptoBase(d.concepto_nombre);
      if (!grupos[base]) grupos[base] = { concepto: base, items: [], total: 0 };
      const valor = calcularValorDeudaHoy(d);
      grupos[base].items.push(d);
      grupos[base].total += valor;
    });
    return Object.values(grupos);
  }, [deudasPendientes]);

  const totalDeuda = deudasPendientes.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);
  const esFavor = totalDeuda < 0;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.bottom = "0"; iframe.style.right = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map(s => s.outerHTML).join("");
    doc.write(`<html><head><title>Estado de Cuenta - ${residente.apartamento}</title>${styles}<style>
      @page { size: letter; margin: 12mm; }
      body { background: white !important; margin: 0; padding: 0; font-family: sans-serif; }
      .no-print { display: none !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style></head><body>${content.innerHTML}<script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement.remove(),200);};<\/script></body></html>`);
    doc.close();
  };

  if (loading) return (
    <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={36} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex flex-col items-center overflow-y-auto no-scrollbar p-3 sm:p-6 md:p-10">

      {/* BARRA ACCIONES */}
      <div className="no-print w-full max-w-4xl bg-white p-3 sm:p-4 mb-4 flex justify-between items-center rounded-2xl shadow-2xl sticky top-0 z-10 border border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${esFavor ? 'bg-emerald-500' : 'bg-slate-900'}`}>
            {esFavor ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase text-slate-400 leading-none">Estado de Cuenta</p>
            <h2 className="text-xs sm:text-sm font-black uppercase text-slate-800 truncate">
              {residente.nombre} · T{residente.torre.slice(-1)}-{residente.apartamento}
            </h2>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handlePrint} className="bg-slate-900 text-white rounded-xl font-black uppercase hover:bg-emerald-600 transition-all flex items-center gap-1.5 px-3 py-2.5 text-[9px] sm:px-5 sm:py-3 sm:text-[10px]">
            <Printer size={13} />
            <span className="hidden sm:inline">IMPRIMIR</span>
          </button>
          <button onClick={onClose} className="p-2.5 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* DOCUMENTO */}
      <div ref={printRef} className="w-full max-w-4xl bg-white shadow-2xl text-slate-800 flex flex-col border border-slate-100 mb-10 rounded-2xl sm:rounded-3xl overflow-hidden">

        {/* HEADER OSCURO */}
        <div className="bg-slate-900 px-5 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="/logo.png" alt="Logo" className="w-10 sm:w-14 h-auto object-contain flex-shrink-0 brightness-0 invert opacity-70" />
            <div>
              <h1 className="text-sm sm:text-base font-black text-white uppercase leading-tight">
                Agrupación Res. El Parque de las Flores
              </h1>
              <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                NIT. 832.011.421-3 · Soacha, Cundinamarca
              </p>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-2">
            <span className="bg-emerald-500 text-slate-900 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide">
              ESTADO DE CUENTA
            </span>
            <p className="text-[8px] font-bold text-slate-500 uppercase">
              {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* BANNER RESIDENTE + TOTAL */}
        <div className="flex flex-col sm:flex-row border-b border-slate-100">
          <div className="flex-1 p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Titular de la Unidad</p>
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase leading-tight">
              {residente.nombre || 'PROPIETARIO'}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase">
                Torre {residente.torre.slice(-1)} · Apto {residente.apartamento}
              </span>
              {residente.celular && (
                <span className="text-[9px] text-slate-400 font-bold">{residente.celular}</span>
              )}
            </div>
          </div>
          <div className={`p-4 sm:p-6 sm:min-w-[200px] flex flex-col justify-center ${esFavor ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${esFavor ? 'text-emerald-600' : 'text-rose-500'}`}>
              {esFavor ? 'Saldo a Favor' : 'Total a Pagar'}
            </p>
            <h3 className={`text-2xl sm:text-3xl font-black tabular-nums leading-none ${esFavor ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${Math.abs(totalDeuda).toLocaleString()}
            </h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1.5">
              {deudasPendientes.length} concepto{deudasPendientes.length !== 1 ? 's' : ''} pendiente{deudasPendientes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* OBLIGACIONES AGRUPADAS */}
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
            <h3 className="text-[10px] sm:text-xs font-black uppercase text-slate-800 tracking-widest">
              Detalle de Obligaciones
            </h3>
          </div>

          {deudasPendientes.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-emerald-100 rounded-2xl">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
              <p className="font-black text-slate-900 uppercase text-sm">La unidad se encuentra al día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deudasAgrupadas.map((grupo, gi) => (
                <div key={gi} className="border border-slate-200 rounded-xl overflow-hidden">

                  {/* Cabecera del concepto */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${grupo.total < 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-tight">
                        {grupo.concepto}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-400 uppercase hidden sm:block">
                        {grupo.items.length} periodo{grupo.items.length !== 1 ? 's' : ''}
                      </span>
                      <span className={`text-sm font-black tabular-nums px-2 py-0.5 rounded-lg ${grupo.total < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        ${Math.abs(grupo.total).toLocaleString()}
                        {grupo.total < 0 ? ' CR' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Filas por periodo */}
                  <div className="divide-y divide-slate-50 bg-white">
                    {grupo.items.map((d: any) => {
                      const valor = calcularValorDeudaHoy(d);
                      const periodo = formatPeriodo(d);
                      return (
                        <div key={d.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/60 transition-colors">
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            {periodo}
                          </span>
                          <span className={`text-[11px] sm:text-xs font-black tabular-nums ${valor < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                            ${Math.abs(valor).toLocaleString()}{valor < 0 ? ' CR' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Total consolidado */}
              <div className={`flex justify-between items-center px-4 py-3.5 rounded-xl ${esFavor ? 'bg-emerald-600' : 'bg-slate-900'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  Saldo Consolidado
                </span>
                <span className="text-lg sm:text-xl font-black tabular-nums text-white">
                  ${Math.abs(totalDeuda).toLocaleString()}{esFavor ? ' CR' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ÚLTIMOS MOVIMIENTOS */}
        {pagos.length > 0 && (
          <div className="px-4 sm:px-6 md:px-8 pb-6">
            <div className="border-t border-slate-100 pt-5 mb-3 flex items-center gap-2">
              <History size={12} className="text-slate-400" />
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Últimos Pagos Registrados
              </h3>
            </div>

            <div className="space-y-1">
              {pagos.slice(0, 8).map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex-shrink-0 group-hover:bg-slate-200 transition-colors">
                      RC-{p.numero_recibo}
                    </span>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase truncate">
                      {p.concepto_texto
                        ? p.concepto_texto.split("||").map((c: any) => c.split("|")[0]).join(" · ")
                        : "Pago de Cartera"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[9px] text-slate-300 hidden sm:block tabular-nums">{p.fecha_pago}</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 tabular-nums">
                      ${Number(p.monto_total).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase space-y-0.5">
            <p>Banco Caja Social · Ahorros · <b className="text-slate-600">24511819298</b></p>
            <p>Convenio: <b>15939402</b> • Referencia: <b>{residente.torre.slice(-1)}{residente.apartamento}</b></p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[8px] font-black uppercase text-slate-500">Administración · Parque de las Flores</p>
            <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">Documento informativo · No es factura legal</p>
          </div>
        </div>
      </div>
    </div>
  );
}