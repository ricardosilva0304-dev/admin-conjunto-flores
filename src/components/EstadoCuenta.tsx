"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import { X, Loader2, Wallet, History, CheckCircle2, UserCircle } from "lucide-react";

interface Props { residente: any; deudas: any[]; onClose: () => void; }

export default function EstadoCuenta({ residente, deudas, onClose }: Props) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPagos = async () => {
      const { data } = await supabase.from("pagos").select("*").eq("residente_id", residente.id).order("fecha_pago", { ascending: false });
      if (data) setPagos(data);
      setLoading(false);
    };
    fetchPagos();
  }, [residente]);

  // 1. ORDENAR DE MÁS ANTIGUO A MÁS RECIENTE
  const deudasPendientes = useMemo(() => {
    return [...deudas]
      .filter(d => calcularValorDeudaHoy(d) !== 0)
      .sort((a, b) => new Date(a.fecha_vencimiento || 0).getTime() - new Date(b.fecha_vencimiento || 0).getTime());
  }, [deudas]);

  const totalDeuda = deudasPendientes.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.bottom = "0"; iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.write(`
      <html>
        <head>
          <title>Estado de Cuenta - ${residente.apartamento}</title>
          <style>
            @page { size: letter; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; }
            
            /* TRUCO PARA REPETIR ENCABEZADO EN CADA HOJA */
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            
            tr { page-break-inside: avoid; }
            
            .header-print { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .logo { width: 60px; height: auto; }
            .title-main { font-size: 14px; font-weight: 800; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 9px; color: #64748b; margin: 0; }
            
            .info-grid { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            .residente-info { font-size: 11px; }
            .residente-info b { font-size: 13px; text-transform: uppercase; }
            
            .saldo-box { text-align: right; }
            .saldo-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; }
            .saldo-valor { font-size: 20px; font-weight: 900; color: #e11d48; margin: 0; }
            
            th { text-align: left; padding: 8px; border-bottom: 1px solid #000; font-size: 10px; text-transform: uppercase; background: #f8fafc; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
            .text-right { text-align: right; }
            .total-row { background: #f1f5f9; font-weight: bold; }
            
            .footer-info { font-size: 8px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <td colspan="2" style="border:none; padding:0;">
                  <div class="header-print">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="display: flex; gap: 10px; align-items: center;">
                        <img src="/logo.png" class="logo" />
                        <div>
                          <h1 class="title-main">Agrupación Res. El Parque de las Flores</h1>
                          <p class="subtitle">NIT. 832.011.421-3 • Soacha, Cundinamarca</p>
                        </div>
                      </div>
                      <div style="text-align: right">
                        <span style="font-size: 10px; font-weight: bold; background: #000; color: #fff; padding: 2px 8px; border-radius: 4px;">ESTADO DE CUENTA</span>
                        <p style="font-size: 8px; margin-top: 4px;">Emisión: ${new Date().toLocaleDateString('es-CO')}</p>
                      </div>
                    </div>
                    
                    <div class="info-grid">
                      <div class="residente-info">
                        <span class="saldo-label">Responsable:</span><br/>
                        <b>${residente.nombre || 'PROPIETARIO'}</b><br/>
                        Unidad: T${residente.torre.slice(-1)} - ${residente.apartamento}
                      </div>
                      <div class="saldo-box">
                        <span class="saldo-label">${totalDeuda < 0 ? 'Crédito a Favor' : 'Total Pendiente'}</span>
                        <p class="saldo-valor" style="color: ${totalDeuda < 0 ? '#10b981' : '#e11d48'}">
                          $${Math.abs(totalDeuda).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th>Concepto / Servicio Pendiente</th>
                <th class="text-right">Valor Hoy</th>
              </tr>
            </thead>
            <tbody>
              ${deudasPendientes.map(d => `
                <tr>
                  <td style="text-transform: uppercase;">${d.concepto_nombre}</td>
                  <td class="text-right"><b>$${Math.abs(calcularValorDeudaHoy(d)).toLocaleString()}</b> ${calcularValorDeudaHoy(d) < 0 ? 'CR' : ''}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td class="text-right">GRAN TOTAL CONSOLIDADO:</td>
                <td class="text-right" style="font-size: 12px; color: ${totalDeuda < 0 ? '#10b981' : '#e11d48'}">
                  $${Math.abs(totalDeuda).toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="border:none;">
                  <div class="footer-info">
                    <p><b>PAGO EN BANCO CAJA SOCIAL:</b> Cuenta Ahorros: 24511819298 • Convenio: 15939402 • Ref: ${residente.apartamento}</p>
                    <p style="text-align: center; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 5px;">Este documento es un extracto informativo y no constituye una factura legal.</p>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.frameElement.remove(), 200);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex flex-col items-center p-4 md:p-10 overflow-y-auto no-scrollbar">
      
      {/* BARRA DE ACCIONES (No cambia mucho, solo visual) */}
      <div className="w-full max-w-4xl bg-white p-4 mb-6 flex justify-between items-center rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white"><Wallet size={20} /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Previsualización de Impresión</p>
            <h2 className="text-sm font-black uppercase text-slate-800">Unidad {residente.torre} - {residente.apartamento}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">IMPRIMIR PDF</button>
          <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
        </div>
      </div>

      {/* DOCUMENTO EN PANTALLA (Sigue el mismo estilo simplificado que el de impresión) */}
      <div ref={printRef} className="w-[216mm] bg-white shadow-2xl p-12 text-slate-800 min-h-[279mm] flex flex-col">
        {/* Usamos el mismo diseño que definimos arriba para que lo que ves sea lo que se imprime */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
          <div className="flex gap-4 items-center">
            <img src="/logo.png" alt="Logo" className="w-16 h-auto" />
            <div>
              <h1 className="text-base font-black uppercase">Agrupación Res. El Parque de las Flores</h1>
              <p className="text-[10px] text-slate-500">NIT. 832.011.421-3 • Soacha, Cundinamarca</p>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded font-bold">ESTADO DE CUENTA</span>
            <p className="text-[9px] mt-1 font-bold text-slate-400 uppercase">Emisión: {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        <div className="flex justify-between items-end mb-8 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Responsable</p>
            <h2 className="text-lg font-black uppercase leading-tight">{residente.nombre || 'PROPIETARIO'}</h2>
            <p className="text-sm font-bold text-emerald-600">Unidad T{residente.torre.slice(-1)} - {residente.apartamento}</p>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-bold text-slate-400 uppercase">{totalDeuda < 0 ? 'Saldo a Favor' : 'Total a Pagar'}</p>
             <p className={`text-3xl font-black ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
               ${Math.abs(totalDeuda).toLocaleString()}
             </p>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-300">
              <th className="py-2 text-[11px]">Concepto o Servicio Pendiente</th>
              <th className="py-2 text-right text-[11px]">Valor Hoy</th>
            </tr>
          </thead>
          <tbody>
            {deudasPendientes.map((d: any) => (
              <tr key={d.id} className="border-b border-slate-100">
                <td className="py-2 text-[11px] uppercase font-medium">{d.concepto_nombre}</td>
                <td className="py-2 text-right text-[11px] font-bold">${Math.abs(calcularValorDeudaHoy(d)).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-black">
              <td className="py-3 text-right text-[10px] uppercase">Total Consolidado:</td>
              <td className={`py-3 text-right text-sm ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${Math.abs(totalDeuda).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Pagos recientes - Versión compacta */}
        {pagos.length > 0 && (
          <div className="mt-10">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
              <History size={12} /> Últimos Movimientos
            </h3>
            <table className="w-full text-[9px] opacity-70">
              <tbody className="divide-y divide-slate-100">
                {pagos.slice(0, 3).map((p) => (
                  <tr key={p.id}>
                    <td className="py-1 font-bold w-20">RC-{p.numero_recibo}</td>
                    <td className="py-1">{p.fecha_pago}</td>
                    <td className="py-1 uppercase">{p.concepto_texto?.split("||")[0].split("|")[0]}</td>
                    <td className="py-1 text-right font-bold text-emerald-600">${Number(p.monto_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between items-center">
          <div>
            <p><b>BANCO CAJA SOCIAL</b> • Ahorros: 24511819298 • Ref: {residente.apartamento}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-600 uppercase">Administración Parque de las Flores</p>
          </div>
        </div>
      </div>
    </div>
  );
}