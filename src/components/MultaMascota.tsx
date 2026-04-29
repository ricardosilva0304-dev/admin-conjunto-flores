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
          body * { visibility: hidden; }
          #doc-multa-mascota, #doc-multa-mascota * { visibility: visible; }
          #doc-multa-mascota {
            position: absolute;
            left: 0; right: 0; top: 0;
            width: 100%;
            margin: 0; padding: 0;
          }
          @page { size: letter; margin: 1.5cm 2cm; }
          .no-print { display: none !important; }
        }
      `}</style>

            {/* BARRA DE ACCIONES */}
            <div className="no-print w-full max-w-3xl bg-white p-4 rounded-b-2xl md:rounded-3xl mb-8 flex justify-between items-center shadow-2xl border border-slate-200">
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
            <div id="doc-multa-mascota" className="w-full max-w-3xl px-2 md:px-0 animate-in zoom-in-95 duration-500 pb-20">
                <div className="w-full bg-white border border-slate-300 text-slate-800 font-sans text-[11px] leading-relaxed shadow-sm print:shadow-none" style={{ padding: "2cm 2.2cm" }}>

                    {/* ── ENCABEZADO ── */}
                    <div className="flex items-center gap-4 border-b-2 border-[#1a5c3a] pb-4 mb-6">
                        {/* Logo */}
                        <div className="w-[90px] shrink-0">
                            <img src="/logo.png" alt="Logo Parque de las Flores" className="w-full h-auto object-contain" />
                        </div>
                        {/* Info conjunta */}
                        <div className="flex flex-col text-center flex-1">
                            <p className="font-black text-[13px] uppercase text-[#1a5c3a] tracking-wide leading-tight">
                                AGRUPACIÓN RESIDENCIAL EL PARQUE DE LAS FLORES
                            </p>
                            <p className="text-[10px] font-bold text-slate-600 mt-0.5">
                                NIT. 832.011.421-3 &nbsp;|&nbsp; Diagonal 9 # 4B - 90, Soacha, Cundinamarca
                            </p>
                            <p className="text-[10px] font-bold text-slate-600">
                                Tel: 315 340 0657 &nbsp;|&nbsp; cr.parquedelasflores@gmail.com
                            </p>
                        </div>
                        {/* Número */}
                        <div className="w-[90px] shrink-0 border-2 border-[#1a5c3a] rounded p-2 text-center">
                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">No.</p>
                            <p className="text-xl font-black text-slate-900 tabular-nums leading-none">{String(datos.numero).padStart(4, "0")}</p>
                        </div>
                    </div>

                    {/* ── TÍTULO ── */}
                    <h2 className="text-center font-black text-[14px] uppercase tracking-widest mb-6 text-slate-900">
                        REQUERIMIENTO MULTA MASCOTA
                    </h2>

                    {/* ── CUERPO ── */}
                    <p className="text-justify mb-5 text-[10.5px] leading-relaxed">
                        De acuerdo con nuestro reglamento de propiedad horizontal escritura pública 1343 del 2002, código de
                        policía, reunión en el salón comunal con los residentes tenedores de mascotas se acordaron
                        procedimientos, responsabilidades de las mascotas en nuestro conjunto y multas por desacato a las normas.
                    </p>

                    <p className="font-black text-[10.5px] mb-3">
                        Obligaciones para los dueños de mascotas caninas en la Agrupación Residencial Parque de las Flores
                    </p>

                    <ul className="list-disc ml-6 space-y-1.5 mb-5 text-[10.5px]">
                        <li>Responder por cualquier daño que ocasione su mascota a terceros o bienes ajenos.</li>
                        <li>Velar por el bienestar del animal en todo momento al interior del apartamento que no ocasione ruidos molestos para garantizar una sana convivencia con sus vecinos.</li>
                        <li>Recoger los excrementos y depositarla en la caneca que es destinada para las mascotas en el shut de basuras.</li>
                        <li>Llevar siempre a su mascota en las zonas comunes con correa todo tipo de canino.</li>
                        <li>
                            Se establece <strong>MULTA POR NO SER RESPONSABLE CON LA MASCOTA DE $35.000</strong> &ldquo;TREINTA Y CINCO MIL PESOS&rdquo;.
                        </li>
                    </ul>

                    {/* ── TABLA DE DATOS ── */}
                    <div className="border border-slate-800 mt-4 mb-5 text-[10.5px]">
                        <div className="grid grid-cols-2 border-b border-slate-800">
                            <div className="p-2 border-r border-slate-800">
                                <span className="font-black">FECHA:</span>{" "}
                                <span className="ml-1 border-b border-slate-400 inline-block min-w-[160px]">{datos.fecha}</span>
                            </div>
                            <div className="p-2">
                                <span className="font-black">HORA:</span>{" "}
                                <span className="ml-1 border-b border-slate-400 inline-block min-w-[100px]">{datos.hora}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 border-b border-slate-800">
                            <div className="p-2 border-r border-slate-800">
                                <span className="font-black">TORRE:</span>{" "}
                                <span className="ml-1 border-b border-slate-400 inline-block min-w-[50px]">{datos.torre}</span>
                            </div>
                            <div className="p-2 border-r border-slate-800">
                                <span className="font-black">APARTAMENTO:</span>{" "}
                                <span className="ml-1 border-b border-slate-400 inline-block min-w-[50px]">{datos.apartamento}</span>
                            </div>
                            <div className="p-2">
                                <span className="font-black">RESIDENTE:</span>{" "}
                                <span className="ml-1 border-b border-slate-400 inline-block min-w-[80px]">{datos.residente}</span>
                            </div>
                        </div>
                        <div className="p-2">
                            <span className="font-black">MOTIVO DE LA MULTA:</span>{" "}
                            <span className="ml-1 border-b border-slate-400 inline-block min-w-[300px]">{datos.motivo}</span>
                        </div>
                    </div>

                    {/* ── NOTAS ── */}
                    <p className="text-[10.5px] mb-1">
                        Este documento será entregado al infractor y en caso de que sea arrendatario se envía copia al propietario
                        ya que esta multa es causada al apartamento.
                    </p>
                    <p className="text-[10.5px] mb-8">
                        Se envía registro fílmico de la situación por la cual fue la multa al responsable de la mascota.
                    </p>

                    {/* ── FIRMA ── */}
                    <div className="mt-8">
                        <p className="text-[10.5px] italic mb-1">Atentamente,</p>
                        {/* Espacio para firma física al imprimir */}
                        <div className="h-12" />
                        <p className="font-black text-[11px] uppercase">ADRIANA CONSTANZA MUÑOZ BELLO</p>
                        <p className="text-[10.5px]">Administradora</p>
                    </div>

                    {/* ── PIE DE PÁGINA ── */}
                    <div className="border-t border-slate-300 mt-8 pt-2 text-center text-[8.5px] text-slate-400 font-bold">
                        Página 1 de 1
                    </div>

                </div>

                <p className="no-print mt-10 text-center text-[10px] text-rose-500/50 font-black uppercase tracking-[0.5em] animate-pulse">
                    Vista de documento finalizada
                </p>
            </div>
        </div>
    );
}