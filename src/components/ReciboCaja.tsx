"use client";
import React, { useRef } from "react";
import { X } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

interface ReciboProps {
  datos: {
    numero: string; fecha: string; nombre: string; unidad: string;
    valor: number; concepto: string; metodo: string; comprobante: string;
    saldoAnterior: number; email: string;
    fechaTransaccion?: string;
  };
  onClose: () => void;
}

// Estilos inline puros (sin Tailwind) — funcionan igual en pantalla y en el iframe de impresión
const ReciboContenido = ({ datos }: { datos: any }) => {
  const saldoAnterior = Number(datos.saldoAnterior) || 0;
  const abonoRealizado = Number(datos.valor) || 0;
  const nuevoSaldoRaw = saldoAnterior - abonoRealizado;
  const esSaldoAFavor = nuevoSaldoRaw < 0;
  const cargos = datos.concepto.includes("||") ? datos.concepto.split("||") : [datos.concepto];

  const c = {
    dark: "#0f172a", gray: "#64748b", lightBg: "#f8fafc", midBg: "#f1f5f9",
    green: "#059669", red: "#dc2626", rose: "#e11d48", dotted: "#e2e8f0",
  };

  return (
    <div style={{ width: "100%", maxWidth: "780px", background: "#fff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: c.dark, padding: "40px 48px", boxSizing: "border-box", lineHeight: "1.4", margin: "0 auto" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${c.dark}`, paddingBottom: "14px", marginBottom: "20px", gap: "12px" }}>
        <div style={{ width: "160px", flexShrink: 0 }}>
          <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        <div style={{ flex: 1, textAlign: "center", padding: "0 12px" }}>
          <div style={{ fontWeight: 900, fontSize: "11px", textTransform: "uppercase", marginBottom: "2px" }}>Agrupación Res. El Parque de las Flores</div>
          <div style={{ fontWeight: 900, fontSize: "10px", textTransform: "uppercase", marginBottom: "5px" }}>NIT. 832.011.421-3</div>
          <div style={{ color: c.gray, fontSize: "9.5px", fontWeight: 700 }}>Diagonal 9 # 4B-90 • Soacha, Cundinamarca</div>
          <div style={{ color: c.gray, fontSize: "9.5px", fontWeight: 700 }}>Celular: 315 340 0657</div>
          <div style={{ color: c.gray, fontSize: "9.5px", fontWeight: 700 }}>Banco Caja Social</div>
          <div style={{ color: c.gray, fontSize: "9.5px", fontWeight: 700 }}>Cuenta de Ahorros 24511819298</div>
          <div style={{ color: c.red, fontSize: "9.5px", fontWeight: 700 }}>Convenio 15939402 • Ref.: Torre y Apat.</div>
          <div style={{ color: c.gray, fontSize: "9.5px", fontWeight: 700 }}>E-MAIL: cr.parquedelasflores@gmail.com</div>
        </div>
        <div style={{ width: "120px", flexShrink: 0, border: `2px solid ${c.dark}`, padding: "8px 10px", textAlign: "center", background: c.lightBg }}>
          <div style={{ fontSize: "7px", fontWeight: 900, textTransform: "uppercase", color: c.gray, marginBottom: "4px", letterSpacing: "1px" }}>Recibo de Caja</div>
          <div style={{ fontSize: "20px", fontWeight: 900, color: c.dark }}>Nº {datos.numero}</div>
        </div>
      </div>

      {/* TABLA */}
      <div style={{ border: `1px solid ${c.dark}`, marginBottom: "4px" }}>

        <div style={{ display: "flex", borderBottom: `1px solid ${c.dark}` }}>
          <div style={{ flex: 1, padding: "8px 10px", borderRight: `1px solid ${c.dark}`, background: c.lightBg, display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "7px", fontWeight: 900, color: c.gray, textTransform: "uppercase" }}>Ciudad y Fecha:</span>
            <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "11.5px" }}>SOACHA, {datos.fecha}</span>
          </div>
          <div style={{ width: "170px", padding: "8px 10px", background: c.midBg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "7px", fontWeight: 900, color: c.gray, textTransform: "uppercase" }}>Valor:</span>
            <span style={{ fontWeight: 900, fontSize: "17px", color: c.green }}>${datos.valor.toLocaleString("es-CO")}</span>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: `1px solid ${c.dark}` }}>
          <div style={{ flex: 1, padding: "7px 10px", borderRight: `1px solid ${c.dark}`, fontWeight: 700, textTransform: "uppercase", fontSize: "10.5px" }}>
            <span style={{ fontSize: "7px", fontWeight: 900, color: c.gray, marginRight: "5px" }}>RECIBIDO DE:</span>{datos.nombre}
          </div>
          <div style={{ width: "170px", padding: "7px 10px", fontWeight: 700, textTransform: "uppercase", fontSize: "10.5px" }}>
            <span style={{ fontSize: "7px", fontWeight: 900, color: c.gray, marginRight: "5px" }}>UNIDAD:</span>{datos.unidad}
          </div>
        </div>

        <div style={{ padding: "7px 10px", borderBottom: `1px solid ${c.dark}`, fontStyle: "italic", fontWeight: 700, background: "#fafafa" }}>
          <span style={{ fontStyle: "normal", textTransform: "uppercase", fontWeight: 900, fontSize: "7px", color: c.gray, marginRight: "5px" }}>La suma de:</span>
          <span style={{ textTransform: "uppercase", fontSize: "10px" }}>{numeroALetras(datos.valor)}</span>
        </div>

        <div>
          <div style={{ padding: "5px 10px", background: c.lightBg, fontSize: "7px", fontWeight: 900, color: c.gray, textTransform: "uppercase", letterSpacing: "1px", borderBottom: `1px solid ${c.dotted}` }}>
            Detalle de conceptos pagados
          </div>
          <div style={{ padding: "8px 20px" }}>
            {cargos.map((cargo: string, idx: number) => {
              const parts = cargo.split("|");
              return (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px dotted ${c.dotted}`, paddingBottom: "4px", marginBottom: "5px", textTransform: "uppercase", fontWeight: 700, fontSize: "10px" }}>
                  <span style={{ color: "#334155", flex: 1 }}>{parts[0] || "Pago"}</span>
                  <span style={{ color: c.dark, fontWeight: 900 }}>{parts[1] || ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MÉTODO DE PAGO */}
      <div style={{ border: `1px solid ${c.dark}`, padding: "7px 20px", marginBottom: "14px", background: c.lightBg, display: "flex", alignItems: "center", gap: "36px", fontSize: "8.5px", fontWeight: 900 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{ width: "11px", height: "11px", border: `1px solid ${c.dark}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "9px" }}>
            {datos.metodo === "Efectivo" ? "X" : ""}
          </div>
          <span>EFECTIVO</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{ width: "11px", height: "11px", border: `1px solid ${c.dark}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "9px" }}>
            {datos.metodo !== "Efectivo" ? "X" : ""}
          </div>
          <span>TRANSFERENCIA</span>
        </div>
        <div style={{ flex: 1, textAlign: "right", fontSize: "8px", color: c.gray, fontStyle: "italic", fontWeight: 700 }}>
          Ref: {datos.comprobante || "N/A"}
          {datos.fechaTransaccion && <span style={{ color: "#475569", marginLeft: "8px" }}> • Fecha Trx: {datos.fechaTransaccion}</span>}
        </div>
      </div>

      {/* SALDOS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 36px", borderTop: `1px solid ${c.dotted}`, borderBottom: `1px solid ${c.dotted}`, background: "#fafafa", marginBottom: "36px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "7px", fontWeight: 900, color: c.gray, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Saldo Anterior</div>
          <div style={{ fontWeight: 900, fontSize: "12px", color: c.gray }}>${Math.abs(saldoAnterior).toLocaleString("es-CO")}</div>
        </div>
        <div style={{ color: "#cbd5e1", fontSize: "18px" }}>−</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "7px", fontWeight: 900, color: c.green, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Abono Realizado</div>
          <div style={{ fontWeight: 900, fontSize: "12px", color: c.green }}>${abonoRealizado.toLocaleString("es-CO")}</div>
        </div>
        <div style={{ color: "#cbd5e1", fontSize: "18px" }}>=</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "7px", fontWeight: 900, color: esSaldoAFavor ? c.green : c.rose, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
            {esSaldoAFavor ? "Saldo a Favor" : "Saldo Pendiente"}
          </div>
          <div style={{ fontWeight: 900, fontSize: "14px", color: esSaldoAFavor ? c.green : c.rose, fontStyle: "italic" }}>
            ${Math.abs(nuevoSaldoRaw).toLocaleString("es-CO")}
          </div>
        </div>
      </div>

      {/* FIRMAS */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "80px", padding: "0 12px" }}>
        <div style={{ flex: 1, borderTop: `1px solid ${c.dark}`, paddingTop: "4px", fontSize: "7.5px", fontWeight: 900, textTransform: "uppercase", color: c.gray, textAlign: "center", fontStyle: "italic" }}>
          Firma Administración
        </div>
        <div style={{ flex: 1, borderTop: `1px solid ${c.dark}`, paddingTop: "4px", fontSize: "7.5px", fontWeight: 900, textTransform: "uppercase", color: c.gray, textAlign: "center", fontStyle: "italic" }}>
          Firma Contador
        </div>
      </div>
    </div>
  );
};

export default function ReciboCaja({ datos, onClose }: ReciboProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Abre un iframe invisible con el recibo en HTML puro + estilos inline,
  // llama window.print() y el navegador lo renderiza idéntico a la pantalla.
  // Para PDF: el usuario elige "Guardar como PDF" en el diálogo de impresión.
  const lanzarImpresion = (titulo: string) => {
    const content = printRef.current;
    if (!content) return;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo}</title>
  <style>
    @page { size: letter portrait; margin: 12mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #fff; }
  </style>
</head>
<body>
  ${content.innerHTML}
  <script>
    var imgs = document.images;
    var loaded = 0;
    function tryPrint() { loaded++; if (loaded >= imgs.length) setTimeout(function(){ window.print(); }, 100); }
    if (imgs.length === 0) { setTimeout(function(){ window.print(); }, 100); }
    else { for (var i = 0; i < imgs.length; i++) { imgs[i].onload = tryPrint; imgs[i].onerror = tryPrint; } }
  <\/script>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:850px;height:1100px;border:0;visibility:hidden;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    // Limpiar después de imprimir
    const cleanup = () => setTimeout(() => { if (iframe.parentNode) iframe.remove(); }, 1000);
    iframe.contentWindow?.addEventListener("afterprint", cleanup);
    setTimeout(cleanup, 15000); // fallback
  };

  const handlePrint = () => lanzarImpresion(`RC-${datos.numero}`);
  const handleGuardarPDF = () => lanzarImpresion(`RC-${datos.numero}_${datos.unidad.replace(/\s/g, "")}`);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[500] flex flex-col items-center overflow-y-auto no-scrollbar p-3 sm:p-6 md:p-8">

      {/* BARRA DE ACCIONES */}
      <div className="no-print w-full max-w-4xl bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 flex justify-between items-center shadow-2xl border border-white/20 sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            Imprimir
          </button>
          <button onClick={handleGuardarPDF} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
            Guardar PDF
          </button>
        </div>
        <button onClick={onClose} className="p-2.5 sm:p-3 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
          <X size={20} />
        </button>
      </div>

      {/* RECIBO EN PANTALLA — mismos estilos inline que se envían al iframe */}
      <div ref={printRef} className="w-full max-w-4xl bg-white shadow-2xl animate-in zoom-in-95 duration-500 mb-10 rounded-xl sm:rounded-2xl overflow-hidden">
        <ReciboContenido datos={datos} />
      </div>

    </div>
  );
}