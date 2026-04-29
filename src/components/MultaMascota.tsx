"use client";
import React from "react";
import { Printer, X } from "lucide-react";

interface MultaMascotaProps {
    datos: {
        numero: number;
        fecha: string;
        hora: string;
        torre: string;
        apartamento: string;
        residente: string;
        motivo: string;
    };
    onClose: () => void;
}

export default function MultaMascota({ datos, onClose }: MultaMascotaProps) {
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
          #doc-multa-mascota, #doc-multa-mascota * { visibility: visible; }
          #doc-multa-mascota {
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
          @page {
            size: letter;
            margin: 0;
          }
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
                    id="doc-multa-mascota"
                    className="w-full bg-white border border-slate-200 shadow-sm"
                    style={{
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontSize: "10.5pt",
                        lineHeight: "1.55",
                        color: "#1e293b",
                        padding: "1.8cm 2cm",
                        minHeight: "27.9cm",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >

                    {/* ENCABEZADO */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "2.5px solid #1a5c3a", paddingBottom: "12px", marginBottom: "20px" }}>
                        <div style={{ width: "88px", flexShrink: 0 }}>
                            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "auto", objectFit: "contain" }} />
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontWeight: 900, fontSize: "12.5pt", color: "#1a5c3a", textTransform: "uppercase", margin: "0 0 3px" }}>
                                AGRUPACIÓN RESIDENCIAL EL PARQUE DE LAS FLORES
                            </p>
                            <p style={{ fontSize: "9pt", fontWeight: 700, color: "#444", margin: "0 0 1px" }}>
                                NIT. 832.011.421-3 &nbsp;|&nbsp; Diagonal 9 # 4B - 90, Soacha, Cundinamarca
                            </p>
                            <p style={{ fontSize: "9pt", fontWeight: 700, color: "#444", margin: 0 }}>
                                Tel: 315 340 0657 &nbsp;|&nbsp; cr.parquedelasflores@gmail.com
                            </p>
                        </div>
                        <div style={{ width: "84px", flexShrink: 0, border: "2px solid #1a5c3a", borderRadius: "4px", padding: "6px", textAlign: "center" }}>
                            <p style={{ fontSize: "7.5pt", fontWeight: 900, color: "#888", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 2px" }}>No.</p>
                            <p style={{ fontSize: "20pt", fontWeight: 900, color: "#111", lineHeight: 1, margin: 0 }}>
                                {String(datos.numero).padStart(4, "0")}
                            </p>
                        </div>
                    </div>

                    {/* TÍTULO */}
                    <h2 style={{ textAlign: "center", fontWeight: 900, fontSize: "13pt", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 18px" }}>
                        REQUERIMIENTO MULTA MASCOTA
                    </h2>

                    {/* PÁRRAFO INTRO */}
                    <p style={{ textAlign: "justify", marginBottom: "16px" }}>
                        De acuerdo con nuestro reglamento de propiedad horizontal escritura pública 1343 del 2002, código de
                        policía, reunión en el salón comunal con los residentes tenedores de mascotas se acordaron
                        procedimientos, responsabilidades de las mascotas en nuestro conjunto y multas por desacato a las normas.
                    </p>

                    <p style={{ fontWeight: 900, marginBottom: "10px" }}>
                        Obligaciones para los dueños de mascotas caninas en la Agrupación Residencial Parque de las Flores
                    </p>

                    <ul style={{ paddingLeft: "24px", marginBottom: "18px", lineHeight: "1.75" }}>
                        <li>Responder por cualquier daño que ocasione su mascota a terceros o bienes ajenos.</li>
                        <li>Velar por el bienestar del animal en todo momento al interior del apartamento que no ocasione ruidos molestos para garantizar una sana convivencia con sus vecinos.</li>
                        <li>Recoger los excrementos y depositarla en la caneca que es destinada para las mascotas en el shut de basuras.</li>
                        <li>Llevar siempre a su mascota en las zonas comunes con correa todo tipo de canino.</li>
                        <li>Se establece <strong>MULTA POR NO SER RESPONSABLE CON LA MASCOTA DE $35.000</strong> &ldquo;TREINTA Y CINCO MIL PESOS&rdquo;.</li>
                    </ul>

                    {/* TABLA */}
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px", marginTop: "4px" }}>
                        <tbody>
                            <tr>
                                <td style={{ border: "1px solid #222", padding: "7px 10px", width: "60%" }}>
                                    <strong>FECHA:</strong>&nbsp;&nbsp;
                                    <span style={{ borderBottom: "1px solid #888", display: "inline-block", minWidth: "200px" }}>{datos.fecha}</span>
                                </td>
                                <td style={{ border: "1px solid #222", padding: "7px 10px" }}>
                                    <strong>HORA:</strong>&nbsp;&nbsp;
                                    <span style={{ borderBottom: "1px solid #888", display: "inline-block", minWidth: "80px" }}>{datos.hora}</span>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ border: "1px solid #222", padding: 0 }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: "7px 10px", width: "28%", borderRight: "1px solid #222" }}>
                                                    <strong>TORRE:</strong>&nbsp;&nbsp;
                                                    <span style={{ borderBottom: "1px solid #888", display: "inline-block", minWidth: "60px" }}>{datos.torre}</span>
                                                </td>
                                                <td style={{ padding: "7px 10px", width: "34%", borderRight: "1px solid #222" }}>
                                                    <strong>APARTAMENTO:</strong>&nbsp;&nbsp;
                                                    <span style={{ borderBottom: "1px solid #888", display: "inline-block", minWidth: "40px" }}>{datos.apartamento}</span>
                                                </td>
                                                <td style={{ padding: "7px 10px" }}>
                                                    <strong>RESIDENTE:</strong>&nbsp;&nbsp;
                                                    <span style={{ borderBottom: "1px solid #888", display: "inline-block", minWidth: "100px" }}>{datos.residente}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ border: "1px solid #222", padding: "7px 10px" }}>
                                    <strong>MOTIVO DE LA MULTA:</strong>&nbsp;&nbsp;
                                    <span style={{ borderBottom: "1px solid #888", display: "inline-block", minWidth: "350px" }}>{datos.motivo}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* NOTAS */}
                    <p style={{ marginBottom: "4px" }}>
                        Este documento será entregado al infractor y en caso de que sea arrendatario se envía copia al propietario
                        ya que esta multa es causada al apartamento.
                    </p>
                    <p style={{ marginBottom: 0 }}>
                        Se envía registro fílmico de la situación por la cual fue la multa al responsable de la mascota.
                    </p>

                    {/* FIRMA */}
                    <div style={{ marginTop: "36px" }}>
                        <p style={{ fontStyle: "italic", marginBottom: "4px" }}>Atentamente,</p>
                        <div style={{ height: "56px" }} />
                        <p style={{ fontWeight: 900, textTransform: "uppercase", margin: "0 0 2px" }}>ADRIANA CONSTANZA MUÑOZ BELLO</p>
                        <p style={{ margin: 0 }}>Administradora</p>
                    </div>

                    {/* PIE */}
                    <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid #ccc", textAlign: "center", fontSize: "8pt", color: "#888", fontWeight: 700 }}>
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