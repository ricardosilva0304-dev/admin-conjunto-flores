"use client";
import React from "react";
import { Printer, X } from "lucide-react";

interface PazYSalvoProps {
    datos: {
        numero: number;
        propietario: string;
        cedula: string;
        torre: string;
        apartamento: string;
        periodo: string;
        cuota: string;
        fecha_expedicion: string;
    };
    onClose: () => void;
}

export default function PazYSalvo({ datos, onClose }: PazYSalvoProps) {
    return (
        <div className="fixed inset-0 bg-[#0a0c0e]/95 backdrop-blur-md z-[300] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar">

            <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * { visibility: hidden; }
          #doc-paz-salvo, #doc-paz-salvo * { visibility: visible; }
          #doc-paz-salvo {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 1.8cm 2cm !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page { size: letter; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

            {/* BARRA DE ACCIONES */}
            <div className="no-print w-full max-w-[780px] bg-white p-4 rounded-b-2xl md:rounded-3xl mb-6 flex justify-between items-center shadow-2xl border border-slate-200">
                <button
                    onClick={() => window.print()}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-lg flex items-center gap-2"
                >
                    <Printer size={16} /> IMPRIMIR / GUARDAR PDF
                </button>
                <button onClick={onClose} className="p-4 hover:bg-slate-50 text-slate-300 rounded-full transition-colors">
                    <X size={26} />
                </button>
            </div>

            {/* DOCUMENTO */}
            <div className="w-full max-w-[780px] px-3 md:px-0 pb-20 animate-in zoom-in-95 duration-500">
                <div
                    id="doc-paz-salvo"
                    className="w-full bg-white border border-slate-200 shadow-sm"
                    style={{
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontSize: "10.5pt",
                        lineHeight: "1.6",
                        color: "#1e293b",
                        padding: "1.8cm 2cm",
                        minHeight: "27.9cm",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >

                    {/* ── ENCABEZADO ─────────────────────────────────────── */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "2px solid #cbd5e1", paddingBottom: "12px", marginBottom: "28px" }}>
                        <div style={{ width: "88px", flexShrink: 0 }}>
                            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "auto", objectFit: "contain" }} />
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontWeight: 900, fontSize: "12.5pt", color: "#1a5c3a", textTransform: "uppercase", margin: "0 0 3px" }}>
                                AGRUPACIÓN RESIDENCIAL EL PARQUE DE LAS FLORES
                            </p>
                            <p style={{ fontSize: "9pt", fontWeight: 700, color: "#555", margin: "0 0 1px" }}>
                                NIT. 832.011.421-3 &nbsp;|&nbsp; Diagonal 9 # 4B - 90, Soacha, Cundinamarca
                            </p>
                            <p style={{ fontSize: "9pt", fontWeight: 700, color: "#555", margin: 0 }}>
                                Tel: 315 340 0657 &nbsp;|&nbsp; cr.parquedelasflores@gmail.com
                            </p>
                        </div>
                    </div>

                    {/* ── TÍTULO ─────────────────────────────────────────── */}
                    <h1 style={{ textAlign: "center", fontWeight: 900, fontSize: "20pt", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                        PAZ Y SALVO
                    </h1>
                    <p style={{ textAlign: "center", fontStyle: "italic", fontSize: "11pt", color: "#444", margin: "0 0 28px" }}>
                        Certificado de Paz y Salvo por Expensas Comunes
                    </p>

                    {/* ── PÁRRAFO INTRO ──────────────────────────────────── */}
                    <p style={{ textAlign: "justify", marginBottom: "22px", fontSize: "10.5pt" }}>
                        En calidad de Administradora y Representante Legal de la{" "}
                        <strong>Agrupación Residencial El Parque de las Flores PH</strong>, NIT{" "}
                        <strong>832.011.421-3</strong>, de conformidad con lo establecido en la{" "}
                        <strong>Ley 675 de 2001 (Ley de Propiedad Horizontal)</strong>,{" "}
                        <strong>CERTIFICO</strong> que:
                    </p>

                    {/* ── TABLA DE DATOS ─────────────────────────────────── */}
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "22px", fontSize: "10.5pt" }}>
                        <tbody>
                            <tr>
                                <td style={{ border: "1px solid #888", padding: "8px 12px", width: "38%", fontWeight: 700, backgroundColor: "#f8fafc" }}>
                                    Propietario
                                </td>
                                <td style={{ border: "1px solid #888", padding: "8px 12px", fontWeight: 900, textTransform: "uppercase" }}>
                                    {datos.propietario}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid #888", padding: "8px 12px", fontWeight: 700, backgroundColor: "#f8fafc" }}>
                                    No. de Cédula
                                </td>
                                <td style={{ border: "1px solid #888", padding: "8px 12px" }}>
                                    {datos.cedula}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid #888", padding: "8px 12px", fontWeight: 700, backgroundColor: "#f8fafc" }}>
                                    Inmueble
                                </td>
                                <td style={{ border: "1px solid #888", padding: "8px 12px" }}>
                                    Apartamento {datos.apartamento}, {datos.torre}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid #888", padding: "8px 12px", fontWeight: 700, backgroundColor: "#f8fafc" }}>
                                    Período certificado
                                </td>
                                <td style={{ border: "1px solid #888", padding: "8px 12px" }}>
                                    {datos.periodo}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid #888", padding: "8px 12px", fontWeight: 700, backgroundColor: "#f8fafc" }}>
                                    Cuota de administración
                                </td>
                                <td style={{ border: "1px solid #888", padding: "8px 12px" }}>
                                    {datos.cuota} mensuales
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ── CUERPO ─────────────────────────────────────────── */}
                    <p style={{ textAlign: "justify", marginBottom: "16px", fontSize: "10.5pt" }}>
                        El propietario mencionado se encuentra a <strong>PAZ Y SALVO</strong> por concepto de expensas
                        comunes, no presenta obligaciones pendientes, pecuniarias ni no pecuniarias, incluyendo
                        cuotas ordinarias, extraordinarias y multas, hasta la fecha indicada.
                    </p>

                    <p style={{ textAlign: "justify", marginBottom: "20px", fontSize: "10.5pt" }}>
                        El presente certificado se expide a solicitud del interesado, para los fines que estime
                        conveniente, en el municipio de Soacha, Cundinamarca.
                    </p>

                    {/* ── NOTA ───────────────────────────────────────────── */}
                    <div style={{
                        borderLeft: "4px solid #1a5c3a",
                        backgroundColor: "#f0fdf4",
                        padding: "10px 14px",
                        marginBottom: "28px",
                        fontSize: "10pt",
                        fontStyle: "italic",
                        color: "#374151",
                    }}>
                        <strong style={{ fontStyle: "normal" }}>Nota:</strong>{" "}
                        Este certificado tiene una vigencia de 30 días a partir de la fecha de expedición ({datos.fecha_expedicion}).
                        Para verificar su autenticidad, comuníquese con la administración al correo{" "}
                        <span style={{ fontWeight: 700 }}>cr.parquedelasflores@gmail.com</span>.
                    </div>

                    {/* ── FIRMA ──────────────────────────────────────────── */}
                    <div style={{ marginTop: "8px" }}>
                        <p style={{ fontSize: "10.5pt", marginBottom: "4px" }}>Cordialmente,</p>
                        <div style={{ height: "60px" }} />
                        <p style={{ fontWeight: 900, fontSize: "10.5pt", textTransform: "uppercase", margin: "0 0 2px" }}>
                            ADRIANA CONSTANZA MUÑOZ BELLO
                        </p>
                        <p style={{ fontSize: "10.5pt", margin: 0 }}>Administradora</p>
                    </div>

                    {/* ── PIE ────────────────────────────────────────────── */}
                    <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #ccc", textAlign: "center", fontSize: "8pt", color: "#888", fontWeight: 700 }}>
                        Página 1 de 1
                    </div>

                </div>

                <p className="no-print mt-8 text-center text-[10px] text-rose-500/50 font-black uppercase tracking-[0.5em] animate-pulse">
                    Vista de documento finalizada
                </p>
            </div>
        </div>
    );
}