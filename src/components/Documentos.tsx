"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PawPrint, FileText, Plus, Eye, Trash2, Search, Loader2, X, ChevronRight, ShieldCheck } from "lucide-react";
import MultaMascota from "./MultaMascota";
import PazYSalvo from "./PazYSalvo";
import { hoyCol } from "@/lib/utils";

// ── TIPOS ─────────────────────────────────────────────────────────────────────

interface DocumentoGuardado {
    id: string;
    tipo_documento: string;
    numero: number;
    fecha: string;
    hora: string;
    torre: string;
    apartamento: string;
    residente: string;
    motivo: string;
    created_at: string;
}

interface FormData {
    fecha: string;
    hora: string;
    torre: string;
    apartamento: string;
    residente: string;
    motivo: string;
}

// ── CATÁLOGO DE PLANTILLAS ────────────────────────────────────────────────────

const PLANTILLAS = [
    {
        id: "multa_mascota",
        label: "Multa Mascota",
        descripcion: "Requerimiento por incumplimiento de normas de mascotas. Multa $35.000.",
        icono: <PawPrint size={28} />,
    },
    {
        id: "paz_y_salvo",
        label: "Paz y Salvo",
        descripcion: "Certificado de paz y salvo por expensas comunes para el propietario.",
        icono: <ShieldCheck size={28} />,
    },
];

const ESTRUCTURA_TORRES: Record<string, string[]> = {
    "Torre 1": ["101", "102", "103", "104", "105", "106", "107", "108"],
    "Torre 5": generarAptos(),
    "Torre 6": generarAptos(),
    "Torre 7": generarAptos(),
    "Torre 8": generarAptos(),
};

function generarAptos() {
    const aptos: string[] = [];
    for (let piso = 1; piso <= 6; piso++)
        for (let apt = 1; apt <= 4; apt++)
            aptos.push(`${piso}0${apt}`);
    return aptos;
}

const LABEL_TIPO: Record<string, string> = {
    multa_mascota: "Multa Mascota",
    paz_y_salvo: "Paz y Salvo",
};

const ICONO_TIPO: Record<string, JSX.Element> = {
    multa_mascota: <PawPrint size={10} />,
    paz_y_salvo: <ShieldCheck size={10} />,
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function Documentos({ role }: { role?: string }) {
    const [documentos, setDocumentos] = useState<DocumentoGuardado[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");

    // Estado del formulario
    const [plantillaActiva, setPlantillaActiva] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>({
        fecha: "",
        hora: "",
        torre: "",
        apartamento: "",
        residente: "",
        motivo: "",
    });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    // Vista previa del documento imprimible
    const [vistaPrevia, setVistaPrevia] = useState<DocumentoGuardado | null>(null);

    const soloAdmin = role === "admin";

    // ── CARGAR DOCUMENTOS ──
    useEffect(() => {
        cargarDocumentos();

        const canal = supabase.channel("documentos-rt")
            .on("postgres_changes", { event: "*", schema: "public", table: "documentos_generados" }, cargarDocumentos)
            .subscribe();
        return () => { supabase.removeChannel(canal); };
    }, []);

    async function cargarDocumentos() {
        setCargando(true);
        const { data } = await supabase
            .from("documentos_generados")
            .select("*")
            .order("created_at", { ascending: false });
        setDocumentos(data || []);
        setCargando(false);
    }

    // ── PRE-RELLENAR FECHA Y HORA AL ABRIR FORMULARIO ──
    function abrirFormulario(tipo: string) {
        const ahora = hoyCol();
        const fecha = ahora.toLocaleDateString("es-CO", {
            day: "2-digit", month: "long", year: "numeric",
        }).toUpperCase();
        const hora = ahora.toLocaleTimeString("es-CO", {
            hour: "2-digit", minute: "2-digit", hour12: false,
        });
        setForm({ fecha, hora, torre: "", apartamento: "", residente: "", motivo: "" });
        setPlantillaActiva(tipo);
        setError("");
    }

    // ── GUARDAR DOCUMENTO ──
    async function guardarDocumento() {
        // Validación según tipo de plantilla
        if (plantillaActiva === "multa_mascota") {
            if (!form.fecha || !form.hora || !form.torre || !form.apartamento || !form.residente || !form.motivo) {
                setError("Por favor completa todos los campos.");
                return;
            }
        } else if (plantillaActiva === "paz_y_salvo") {
            if (!form.torre || !form.apartamento || !form.residente || !form.motivo || !form.hora || !form.fecha) {
                setError("Por favor completa todos los campos.");
                return;
            }
        }

        setGuardando(true);
        setError("");

        // Obtener número correlativo
        const { data: numData } = await supabase.rpc("siguiente_numero_documento", {
            p_tipo: plantillaActiva,
        });
        const numero = numData || 1;

        const { error: err } = await supabase.from("documentos_generados").insert([{
            tipo_documento: plantillaActiva,
            numero,
            fecha: form.fecha,
            hora: form.hora,
            torre: form.torre,
            apartamento: form.apartamento,
            residente: form.residente,
            motivo: form.motivo,
        }]);

        setGuardando(false);

        if (err) {
            setError("Error al guardar. Intenta de nuevo.");
            return;
        }

        const docCreado: DocumentoGuardado = {
            id: "",
            tipo_documento: plantillaActiva!,
            numero,
            ...form,
            created_at: new Date().toISOString(),
        };
        setPlantillaActiva(null);
        setVistaPrevia(docCreado);
        await cargarDocumentos();
    }

    // ── ELIMINAR ──
    async function eliminarDocumento(id: string) {
        if (!confirm("¿Eliminar este documento del historial?")) return;
        await supabase.from("documentos_generados").delete().eq("id", id);
        cargarDocumentos();
    }

    // ── FILTRO ──
    const docsFiltrados = documentos.filter((d) =>
        [d.residente, d.torre, d.apartamento, d.motivo, LABEL_TIPO[d.tipo_documento] || d.tipo_documento]
            .join(" ").toLowerCase().includes(busqueda.toLowerCase())
    );

    const plantillaInfo = PLANTILLAS.find((p) => p.id === plantillaActiva);

    // ── RENDER ──────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8">

            {/* ══ SECCIÓN: PLANTILLAS (solo admin) ══════════════════════════════════ */}
            {soloAdmin && (
                <div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                        Plantillas disponibles
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {PLANTILLAS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => abrirFormulario(p.id)}
                                className="group text-left bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/30 transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        {p.icono}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-slate-900 text-[13px] leading-tight">{p.label}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{p.descripcion}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 shrink-0 mt-1 transition-colors" />
                                </div>
                            </button>
                        ))}

                        {/* Tarjeta "próximamente" */}
                        <div className="text-left bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-5 flex items-center gap-4 opacity-50">
                            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                                <Plus size={22} />
                            </div>
                            <div>
                                <p className="font-black text-slate-500 text-[12px]">Más plantillas</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Próximamente disponibles</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ SECCIÓN: HISTORIAL ════════════════════════════════════════════════ */}
            <div>
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Historial de documentos
                    </h2>
                    <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por residente, torre..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-[11px] bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-400 transition font-semibold text-slate-700"
                        />
                    </div>
                </div>

                {cargando ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-emerald-500" size={28} />
                    </div>
                ) : docsFiltrados.length === 0 ? (
                    <div className="text-center py-20 text-slate-300">
                        <FileText size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-black text-[12px] uppercase tracking-widest">
                            {busqueda ? "Sin resultados" : "No hay documentos generados aún"}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    <th className="text-left px-5 py-3 font-black uppercase tracking-wider text-slate-400 text-[9px]">No.</th>
                                    <th className="text-left px-4 py-3 font-black uppercase tracking-wider text-slate-400 text-[9px]">Tipo</th>
                                    <th className="text-left px-4 py-3 font-black uppercase tracking-wider text-slate-400 text-[9px] hidden md:table-cell">Fecha</th>
                                    <th className="text-left px-4 py-3 font-black uppercase tracking-wider text-slate-400 text-[9px]">Torre / Apto</th>
                                    <th className="text-left px-4 py-3 font-black uppercase tracking-wider text-slate-400 text-[9px] hidden lg:table-cell">Residente</th>
                                    <th className="text-left px-4 py-3 font-black uppercase tracking-wider text-slate-400 text-[9px] hidden xl:table-cell">Info</th>
                                    <th className="px-4 py-3 text-[9px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {docsFiltrados.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-5 py-3 font-black text-slate-900 tabular-nums">
                                            {String(doc.numero).padStart(4, "0")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-black text-[9px] uppercase px-2.5 py-1 rounded-lg">
                                                {ICONO_TIPO[doc.tipo_documento] ?? <FileText size={10} />}
                                                {LABEL_TIPO[doc.tipo_documento] || doc.tipo_documento}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{doc.fecha}</td>
                                        <td className="px-4 py-3 font-bold text-slate-700">
                                            {doc.torre} – {doc.apartamento}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{doc.residente}</td>
                                        <td className="px-4 py-3 text-slate-400 hidden xl:table-cell max-w-[200px] truncate">{doc.motivo}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setVistaPrevia(doc)}
                                                    className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-lg transition-colors"
                                                    title="Ver / Imprimir"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                {soloAdmin && (
                                                    <button
                                                        onClick={() => eliminarDocumento(doc.id)}
                                                        className="p-2 hover:bg-rose-50 text-rose-400 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ══ MODAL: FORMULARIO ═════════════════════════════════════════════════ */}
            {plantillaActiva && (
                <div className="fixed inset-0 bg-[#0a0c0e]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">

                        {/* Header modal */}
                        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                    {plantillaInfo?.icono}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[13px]">Nuevo: {plantillaInfo?.label}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold">Completa los datos del documento</p>
                                </div>
                            </div>
                            <button onClick={() => setPlantillaActiva(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* ── CAMPOS MULTA MASCOTA ── */}
                        {plantillaActiva === "multa_mascota" && (
                            <div className="px-7 py-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Fecha</label>
                                        <input type="text" value={form.fecha}
                                            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Hora</label>
                                        <input type="text" value={form.hora}
                                            onChange={(e) => setForm({ ...form, hora: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Torre</label>
                                        <select value={form.torre} onChange={(e) => setForm({ ...form, torre: e.target.value, apartamento: "" })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition">
                                            <option value="">Seleccionar</option>
                                            {Object.keys(ESTRUCTURA_TORRES).map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Apartamento</label>
                                        <select value={form.apartamento} onChange={(e) => setForm({ ...form, apartamento: e.target.value })} disabled={!form.torre}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition disabled:opacity-50">
                                            <option value="">Seleccionar</option>
                                            {(ESTRUCTURA_TORRES[form.torre] || []).map((a) => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Nombre del residente</label>
                                    <input type="text" value={form.residente}
                                        onChange={(e) => setForm({ ...form, residente: e.target.value.toUpperCase() })}
                                        placeholder="Ej: JUAN CARLOS GÓMEZ"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 uppercase placeholder:normal-case placeholder:text-slate-300 outline-none focus:border-emerald-400 transition" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Motivo de la multa</label>
                                    <textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                                        placeholder="Describe el motivo de la multa..." rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition resize-none" />
                                </div>
                            </div>
                        )}

                        {/* ── CAMPOS PAZ Y SALVO ── */}
                        {plantillaActiva === "paz_y_salvo" && (
                            <div className="px-7 py-6 space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Nombre del propietario</label>
                                    <input type="text" value={form.residente}
                                        onChange={(e) => setForm({ ...form, residente: e.target.value.toUpperCase() })}
                                        placeholder="Ej: JUAN CARLOS GÓMEZ"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 uppercase placeholder:normal-case placeholder:text-slate-300 outline-none focus:border-emerald-400 transition" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Número de cédula</label>
                                    <input type="text" value={form.motivo}
                                        onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                                        placeholder="Ej: 1.234.567.890"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Torre</label>
                                        <select value={form.torre} onChange={(e) => setForm({ ...form, torre: e.target.value, apartamento: "" })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition">
                                            <option value="">Seleccionar</option>
                                            {Object.keys(ESTRUCTURA_TORRES).map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Apartamento</label>
                                        <select value={form.apartamento} onChange={(e) => setForm({ ...form, apartamento: e.target.value })} disabled={!form.torre}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition disabled:opacity-50">
                                            <option value="">Seleccionar</option>
                                            {(ESTRUCTURA_TORRES[form.torre] || []).map((a) => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Período certificado (hasta)</label>
                                    <input type="text" value={form.hora}
                                        onChange={(e) => setForm({ ...form, hora: e.target.value })}
                                        placeholder="Ej: 30 de abril de 2026"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Cuota de administración</label>
                                    <input type="text" value={form.fecha}
                                        onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                        placeholder="Ej: $146.000"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-400 transition" />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="px-7 pb-2">
                                <p className="text-rose-500 text-center text-[10px] font-black bg-rose-50 py-3 rounded-xl border border-rose-100">{error}</p>
                            </div>
                        )}

                        {/* Acciones */}
                        <div className="px-7 pb-7 pt-2 flex gap-3">
                            <button onClick={() => setPlantillaActiva(null)}
                                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition active:scale-95">
                                Cancelar
                            </button>
                            <button onClick={guardarDocumento} disabled={guardando}
                                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] uppercase tracking-widest transition active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                {guardando ? <Loader2 size={16} className="animate-spin" /> : null}
                                {guardando ? "Guardando..." : "Guardar y Ver"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ VISTA PREVIA ══════════════════════════════════════════════════════ */}
            {vistaPrevia?.tipo_documento === "multa_mascota" && (
                <MultaMascota
                    datos={vistaPrevia}
                    onClose={() => setVistaPrevia(null)}
                />
            )}
            {vistaPrevia?.tipo_documento === "paz_y_salvo" && (
                <PazYSalvo
                    datos={{
                        numero: vistaPrevia.numero,
                        propietario: vistaPrevia.residente,
                        cedula: vistaPrevia.motivo,
                        torre: vistaPrevia.torre,
                        apartamento: vistaPrevia.apartamento,
                        periodo: vistaPrevia.hora,
                        cuota: vistaPrevia.fecha,
                        fecha_expedicion: new Date(vistaPrevia.created_at).toLocaleDateString("es-CO", {
                            day: "2-digit", month: "long", year: "numeric",
                        }),
                    }}
                    onClose={() => setVistaPrevia(null)}
                />
            )}
        </div>
    );
}