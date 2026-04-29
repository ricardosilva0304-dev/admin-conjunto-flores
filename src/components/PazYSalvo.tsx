"use client";
import React, { useRef, useState } from "react";
import { X, Printer, ShieldCheck } from "lucide-react";
import { hoyCol } from "@/lib/utils";

interface Props {
    residente: any;
    onClose: () => void;
}

export default function PazYSalvo({ residente, onClose }: Props) {
    const printRef = useRef<HTMLDivElement>(null);
    const [cedula, setCedula] = useState("");

    const hoy = hoyCol();
    const meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    // Último día del mes actual
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const periodoHasta = `Hasta el ${ultimoDia} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;

    const torre = residente.torre.slice(-1);
    const inmueble = `Apartamento ${residente.apartamento}, Torre ${torre}`;

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.bottom = "0"; iframe.style.right = "0";
        iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.write(`
      <html><head>
        <title>Paz y Salvo - ${residente.apartamento}</title>
        <style>
          @page { size: letter; margin: 18mm 20mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a1a1a; margin: 0; line-height: 1.55; }
          .header { display: flex; align-items: flex-start; gap: 12px; border-bottom: 1.5px solid #b0b0b0; padding-bottom: 10px; margin-bottom: 26px; }
          .header img { width: 66px; height: auto; flex-shrink: 0; }
          .divider { width: 2px; background: #2c5f9e; align-self: stretch; margin: 0 4px; flex-shrink: 0; }
          .htext { flex: 1; }
          .htext h1 { font-size: 11.5pt; font-weight: 900; color: #2c5f9e; text-transform: uppercase; margin: 0 0 3px; }
          .htext p { font-size: 8pt; color: #555; margin: 1px 0; }
          .pagenum { font-size: 8pt; color: #777; white-space: nowrap; }
          .title-block { text-align: center; margin: 0 0 20px; }
          .title-block h2 { font-size: 16pt; font-weight: 900; margin: 0 0 3px; }
          .title-block p { font-style: italic; font-size: 10pt; color: #444; margin: 0; }
          p.intro, p.body-p { text-align: justify; margin-bottom: 13px; font-size: 10.5pt; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10.5pt; }
          td { border: 1px solid #555; padding: 7px 10px; vertical-align: top; }
          td:first-child { font-weight: 700; width: 38%; }
          td:last-child { font-weight: 700; }
          .nota { border-left: 4px solid #2c5f9e; padding: 9px 13px; margin: 18px 0; font-size: 9.5pt; font-style: italic; color: #333; }
          .nota b { font-style: normal; }
          .footer-line { border-top: 1px solid #b0b0b0; margin-top: 24px; padding-top: 5px; text-align: center; font-size: 8pt; color: #777; }
        </style>
      </head><body>
        <div class="header">
          <img src="/logo.png" alt="Logo"/>
          <div class="divider"></div>
          <div class="htext">
            <h1>Agrupación Residencial El Parque de las Flores</h1>
            <p>NIT. 832.011.421-3 &nbsp;|&nbsp; Diagonal 9 # 4B - 90, Soacha, Cundinamarca</p>
            <p>Tel: 315 340 0657 &nbsp;|&nbsp; cr.parquedelasflores@gmail.com</p>
          </div>
          <div class="pagenum">Página 1 de 1</div>
        </div>

        <div class="title-block">
          <h2>PAZ Y SALVO</h2>
          <p>Certificado de Paz y Salvo por Expensas Comunes</p>
        </div>

        <p class="intro">
          En calidad de Administradora y Representante Legal de la <strong>Agrupación Residencial El
          Parque de las Flores PH</strong>, NIT <strong>832.011.421-3</strong>, de conformidad con lo
          establecido en la <strong>Ley 675 de 2001 (Ley de Propiedad Horizontal)</strong>,
          <strong>CERTIFICO</strong> que:
        </p>

        <table>
          <tr><td>Propietario</td><td>${residente.nombre || "PROPIETARIO"}</td></tr>
          <tr><td>No. de Cédula</td><td>${cedula}</td></tr>
          <tr><td>Inmueble</td><td>${inmueble}</td></tr>
          <tr><td>Período certificado</td><td>${periodoHasta}</td></tr>
          <tr><td>Cuota de administración</td><td>$146.000 mensuales</td></tr>
        </table>

        <p class="body-p">
          El propietario mencionado se encuentra a <strong>PAZ Y SALVO</strong> por concepto de expensas
          comunes, no presenta obligaciones pendientes, pecuniarias ni no pecuniarias, incluyendo
          cuotas ordinarias, extraordinarias y multas, hasta la fecha indicada.
        </p>
        <p class="body-p">
          El presente certificado se expide a solicitud del interesado, para los fines que estime
          conveniente, en el municipio de Soacha, Cundinamarca.
        </p>

        <div class="nota">
          <b>Nota:</b> Este certificado tiene una vigencia de 30 días a partir de la fecha de expedición.
          Para verificar su autenticidad, comuníquese con la administración al correo
          cr.parquedelasflores@gmail.com.
        </div>

        <p style="margin-top:28px; margin-bottom:52px; font-size:10.5pt;">Cordialmente,</p>
        <div style="width:200px; border-top:1px solid #555; margin-bottom:4px;"></div>
        <p style="font-size:10.5pt; font-weight:900; margin:0;">ADRIANA CONSTANZA MUÑOZ BELLO</p>
        <p style="font-size:10.5pt; margin:2px 0 0;">Administradora</p>

        <div class="footer-line">Página 1 de 1</div>
        <script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement.remove(),200);};<\/script>
      </body></html>
    `);
        doc.close();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex flex-col items-center overflow-y-auto no-scrollbar p-3 sm:p-6 md:p-10">

            {/* ── TOOLBAR ─────────────────────────────────────────── */}
            <div className="no-print w-full max-w-3xl bg-white p-3 sm:p-4 mb-4 flex justify-between items-center rounded-2xl shadow-2xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                        <ShieldCheck size={17} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 leading-none">Paz y Salvo</p>
                        <h2 className="text-xs sm:text-sm font-black uppercase text-slate-800">
                            T{torre} — Apto {residente.apartamento}
                        </h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-1.5 px-3 py-2.5 text-[9px] sm:px-6 sm:py-3 sm:text-xs"
                    >
                        <Printer size={13} />
                        <span className="hidden sm:inline">IMPRIMIR</span>
                        <span className="sm:hidden">Imprimir</span>
                    </button>
                    <button onClick={onClose} className="p-2.5 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* ── CAMPO CÉDULA ────────────────────────────────────── */}
            <div className="no-print w-full max-w-3xl mb-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                        <label className="text-[9px] font-black uppercase text-amber-700 mb-1 block tracking-widest">
                            No. de Cédula del propietario
                        </label>
                        <input
                            type="text"
                            value={cedula}
                            onChange={e => setCedula(e.target.value)}
                            placeholder="Ej: 1.234.567.890"
                            className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
                        />
                    </div>
                    <p className="text-[9px] text-amber-600 font-semibold sm:max-w-[200px] leading-relaxed">
                        Ingresa la cédula antes de imprimir. El resto se completa automáticamente.
                    </p>
                </div>
            </div>

            {/* ── VISTA PREVIA DEL DOCUMENTO ──────────────────────── */}
            <div
                ref={printRef}
                className="w-full max-w-3xl bg-white shadow-2xl mb-10 rounded-2xl overflow-hidden border border-slate-100"
                style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: "#1a1a1a" }}
            >
                <div className="px-6 sm:px-10 md:px-14 pt-6 sm:pt-10 md:pt-12 pb-4">

                    {/* MEMBRETE */}
                    <div className="flex items-start gap-3 border-b border-slate-300 pb-4 mb-6">
                        <img src="/logo.png" alt="Logo" className="w-14 sm:w-[66px] h-auto flex-shrink-0 object-contain" />
                        <div className="w-0.5 bg-blue-700 self-stretch mx-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h1 className="text-[9px] sm:text-[11px] font-black text-blue-700 uppercase leading-tight">
                                Agrupación Residencial El Parque de las Flores
                            </h1>
                            <p className="text-[7px] sm:text-[8px] text-slate-500 mt-0.5">
                                NIT. 832.011.421-3 &nbsp;|&nbsp; Diagonal 9 # 4B - 90, Soacha, Cundinamarca
                            </p>
                            <p className="text-[7px] sm:text-[8px] text-slate-500">
                                Tel: 315 340 0657 &nbsp;|&nbsp; cr.parquedelasflores@gmail.com
                            </p>
                        </div>
                        <span className="text-[7px] sm:text-[8px] text-slate-400 flex-shrink-0 whitespace-nowrap">Página 1 de 1</span>
                    </div>

                    {/* TÍTULO */}
                    <div className="text-center mb-5 sm:mb-7">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">PAZ Y SALVO</h2>
                        <p className="text-[9px] sm:text-[10px] italic text-slate-500 mt-1">
                            Certificado de Paz y Salvo por Expensas Comunes
                        </p>
                    </div>

                    {/* INTRO */}
                    <p className="text-[9.5px] sm:text-[10.5px] text-justify leading-relaxed mb-4">
                        En calidad de Administradora y Representante Legal de la{" "}
                        <strong>Agrupación Residencial El Parque de las Flores PH</strong>, NIT{" "}
                        <strong>832.011.421-3</strong>, de conformidad con lo establecido en la{" "}
                        <strong>Ley 675 de 2001 (Ley de Propiedad Horizontal)</strong>,{" "}
                        <strong>CERTIFICO</strong> que:
                    </p>

                    {/* TABLA */}
                    <table className="w-full border-collapse mb-4 sm:mb-5 text-[9.5px] sm:text-[10.5px]">
                        <tbody>
                            {[
                                { label: "Propietario", value: residente.nombre || "PROPIETARIO" },
                                {
                                    label: "No. de Cédula",
                                    value: cedula
                                        ? cedula
                                        : <span className="text-slate-300 italic text-[9px]">Ingresa la cédula arriba</span>
                                },
                                { label: "Inmueble", value: inmueble },
                                { label: "Período certificado", value: periodoHasta },
                                { label: "Cuota de administración", value: "$146.000 mensuales" },
                            ].map(({ label, value }) => (
                                <tr key={label}>
                                    <td className="border border-slate-500 px-2.5 sm:px-3 py-1.5 sm:py-2 font-bold w-[38%] align-top">
                                        {label}
                                    </td>
                                    <td className="border border-slate-500 px-2.5 sm:px-3 py-1.5 sm:py-2 font-bold">
                                        {value}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* CUERPO */}
                    <p className="text-[9.5px] sm:text-[10.5px] text-justify leading-relaxed mb-3">
                        El propietario mencionado se encuentra a <strong>PAZ Y SALVO</strong> por concepto de expensas
                        comunes, no presenta obligaciones pendientes, pecuniarias ni no pecuniarias, incluyendo
                        cuotas ordinarias, extraordinarias y multas, hasta la fecha indicada.
                    </p>
                    <p className="text-[9.5px] sm:text-[10.5px] text-justify leading-relaxed mb-4">
                        El presente certificado se expide a solicitud del interesado, para los fines que estime
                        conveniente, en el municipio de Soacha, Cundinamarca.
                    </p>

                    {/* NOTA */}
                    <div className="border-l-4 border-blue-700 pl-3 sm:pl-4 py-1.5 sm:py-2 my-4">
                        <p className="text-[8.5px] sm:text-[9.5px] italic text-slate-600 leading-relaxed text-justify">
                            <strong className="not-italic">Nota:</strong> Este certificado tiene una vigencia de 30 días
                            a partir de la fecha de expedición. Para verificar su autenticidad, comuníquese con la
                            administración al correo cr.parquedelasflores@gmail.com.
                        </p>
                    </div>

                    {/* FIRMA */}
                    <div className="mt-6 sm:mt-8">
                        <p className="text-[9.5px] sm:text-[10.5px] mb-10 sm:mb-14">Cordialmente,</p>
                        <div className="w-44 sm:w-52 border-t border-slate-500 mb-1" />
                        <p className="text-[9.5px] sm:text-[10.5px] font-black uppercase">ADRIANA CONSTANZA MUÑOZ BELLO</p>
                        <p className="text-[9.5px] sm:text-[10.5px]">Administradora</p>
                    </div>

                </div>

                {/* PIE */}
                <div className="border-t border-slate-200 px-6 py-2 text-center">
                    <p className="text-[7px] sm:text-[8px] text-slate-400">Página 1 de 1</p>
                </div>
            </div>
        </div>
    );
}