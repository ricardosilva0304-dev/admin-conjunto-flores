"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
   UserPlus, Search, Phone,
   Trash2, Edit, X, Loader2,
   Users, AtSign, ChevronDown
} from "lucide-react";

const ESTRUCTURA_TORRES: any = {
   "Torre 1": ["101", "102", "103", "104", "105", "106", "107", "108"],
   "Torre 5": generarAptosEstandar(),
   "Torre 6": generarAptosEstandar(),
   "Torre 7": generarAptosEstandar(),
   "Torre 8": generarAptosEstandar(),
};

function generarAptosEstandar() {
   let aptos = [];
   for (let piso = 1; piso <= 6; piso++)
      for (let apto = 1; apto <= 4; apto++)
         aptos.push(`${piso}0${apto}`);
   return aptos;
}

// ── ICONOS SVG PERSONALIZADOS ─────────────────────────────────────────────────

const CarIcon = ({ className, size = 14 }: { className?: string; size?: number }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
      <path d="M5 12h14" />
   </svg>
);

const MotoIcon = ({ className, size = 14 }: { className?: string; size?: number }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="3" />
      <path d="M10 17h4" />
      <path d="M12 17V9c0-1.5.8-2.5 2-3 1-.4 2-.2 3 .5" />
      <path d="M7 14c-1-1.5-1-3.5 1-4.5L11 8l2 3h4" />
   </svg>
);

const BikeIcon = ({ className, size = 14 }: { className?: string; size?: number }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M5.5 17.5L10 6h4" />
      <path d="M10 6l2.5 5.5" />
      <path d="M12.5 11.5L18.5 17.5" />
      <path d="M18.5 14V6.5" />
      <path d="M16 6.5h5" />
   </svg>
);

// ── BADGE DE VEHÍCULO ─────────────────────────────────────────────────────────

const VehicleBadge = ({
   icon: Icon, count, activeColor
}: {
   icon: React.FC<{ className?: string; size?: number }>;
   count: number;
   activeColor: string;
}) => (
   <div className={`flex flex-col items-center gap-0.5 w-8 ${count === 0 ? "opacity-30" : ""}`}>
      <Icon size={13} className={count > 0 ? activeColor : "text-slate-400"} />
      <span className="text-[9px] font-black tabular-nums text-slate-500 leading-none">{count}</span>
   </div>
);

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function Residentes() {
   const [residentes, setResidentes] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [guardando, setGuardando] = useState(false);
   const [busqueda, setBusqueda] = useState("");
   const [filtroTorre, setFiltroTorre] = useState("TODAS");
   const [showModal, setShowModal] = useState(false);
   const [editandoId, setEditandoId] = useState<number | null>(null);

   const [form, setForm] = useState({
      nombre: "", celular: "", email: "", torre: "", apto: "",
      carros: 0, motos: 0, bicis: 0
   });

   useEffect(() => { cargarResidentes(); }, []);

   async function cargarResidentes() {
      setLoading(true);
      const { data } = await supabase.from("residentes").select("*")
         .order("torre", { ascending: true }).order("apartamento", { ascending: true });
      if (data) setResidentes(data);
      setLoading(false);
   }

   async function manejarGuardar(e: React.FormEvent) {
      e.preventDefault();
      if (!form.nombre || !form.torre || !form.apto) return alert("Llena los datos obligatorios");
      if (!editandoId) {
         const existe = residentes.find(r => r.torre === form.torre && r.apartamento === form.apto);
         if (existe) return alert(`⚠️ La unidad ${form.torre} - ${form.apto} ya está registrada a nombre de ${existe.nombre}.`);
      }
      setGuardando(true);
      const payload = {
         nombre: form.nombre.trim().toUpperCase(), celular: form.celular,
         email: form.email.trim().toLowerCase(), torre: form.torre,
         apartamento: form.apto, carros: Number(form.carros) || 0,
         motos: Number(form.motos) || 0, bicis: Number(form.bicis) || 0
      };
      const action = editandoId
         ? supabase.from("residentes").update(payload).eq("id", editandoId)
         : supabase.from("residentes").insert([payload]);
      const { error } = await action;
      if (!error) {
         setShowModal(false);
         cargarResidentes();
         setForm({ nombre: "", celular: "", email: "", torre: "", apto: "", carros: 0, motos: 0, bicis: 0 });
      } else alert("Error al guardar: " + error.message);
      setGuardando(false);
   }

   const residentesFiltrados = residentes.filter(r => {
      const term = busqueda.toLowerCase().trim();
      if (filtroTorre !== "TODAS" && r.torre !== filtroTorre) return false;
      if (!term) return true;
      if (term.includes("-")) {
         const [tPart, aPart] = term.split("-");
         return r.torre.includes(tPart) && r.apartamento.startsWith(aPart);
      }
      return r.nombre.toLowerCase().includes(term) || r.apartamento.includes(term);
   });

   const totalCarros = residentes.reduce((a, r) => a + (r.carros || 0), 0);
   const totalMotos = residentes.reduce((a, r) => a + (r.motos || 0), 0);
   const totalBicis = residentes.reduce((a, r) => a + (r.bicis || 0), 0);

   if (loading) return (
      <div className="flex h-64 items-center justify-center">
         <Loader2 className="animate-spin text-emerald-400" size={28} />
      </div>
   );

   return (
      <div className="max-w-6xl mx-auto space-y-4 pb-24 font-sans text-slate-800 px-2 sm:px-4 lg:px-0">

         {/* ── CABECERA ──────────────────────────────────────────────────────── */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4">

               {/* Título + stats */}
               <div className="min-w-0">
                  <div className="flex items-center gap-2">
                     <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users size={14} className="text-white" />
                     </div>
                     <h1 className="font-black text-slate-900 text-base sm:text-xl tracking-tight leading-none uppercase">
                        Directorio de Residentes
                     </h1>
                  </div>

                  {/* Stats de vehículos */}
                  <div className="mt-2.5 flex items-center gap-3 sm:gap-5">
                     <span className="text-[10px] font-semibold text-slate-400">
                        {residentes.length} residentes
                     </span>
                     <div className="h-3 w-px bg-slate-200" />
                     <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                           <CarIcon size={11} className="text-emerald-500" />
                           {totalCarros}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                           <MotoIcon size={11} className="text-amber-500" />
                           {totalMotos}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                           <BikeIcon size={11} className="text-blue-500" />
                           {totalBicis}
                        </span>
                     </div>
                  </div>
               </div>

               {/* Botón nuevo */}
               <button
                  onClick={() => {
                     setEditandoId(null);
                     setForm({ nombre: "", celular: "", email: "", torre: "", apto: "", carros: 0, motos: 0, bicis: 0 });
                     setShowModal(true);
                  }}
                  className="flex-shrink-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-200
                     px-3 py-2.5 text-[10px] sm:px-5 sm:py-3 sm:text-xs"
               >
                  <UserPlus size={14} />
                  <span className="hidden sm:inline tracking-wide uppercase">Registrar Nuevo</span>
                  <span className="sm:hidden">Nuevo</span>
               </button>
            </div>
         </div>

         {/* ── FILTROS ───────────────────────────────────────────────────────── */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-2.5">

            {/* Buscador */}
            <div className="relative">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={15} />
               <input
                  placeholder="Buscar por nombre o apartamento (ej: 5-101)…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 sm:py-3
                     text-sm font-medium text-slate-700 placeholder:text-slate-300
                     focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                     transition-all"
                  onChange={(e) => setBusqueda(e.target.value)}
               />
            </div>

            {/* Filtro de torres */}
            <div className="grid grid-cols-6 gap-1 bg-slate-50 rounded-xl p-1">
               {[
                  { key: "TODAS", label: "Todas" },
                  { key: "Torre 1", label: "T-1" },
                  { key: "Torre 5", label: "T-5" },
                  { key: "Torre 6", label: "T-6" },
                  { key: "Torre 7", label: "T-7" },
                  { key: "Torre 8", label: "T-8" },
               ].map(({ key, label }) => (
                  <button
                     key={key}
                     onClick={() => setFiltroTorre(key)}
                     className={`py-2 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide transition-all ${filtroTorre === key
                           ? "bg-emerald-600 text-white shadow-sm"
                           : "text-slate-400 hover:text-slate-600 hover:bg-white"
                        }`}
                  >
                     {label}
                  </button>
               ))}
            </div>
         </div>

         {/* Contador de resultados */}
         {busqueda || filtroTorre !== "TODAS" ? (
            <p className="text-xs text-slate-400 font-medium px-1">
               {residentesFiltrados.length} resultado{residentesFiltrados.length !== 1 ? "s" : ""}
            </p>
         ) : null}

         {/* ── LISTADO POR TORRE ─────────────────────────────────────────────── */}
         <div className="space-y-8">
            {Array.from(new Set(residentesFiltrados.map(r => r.torre))).sort().map(torre => (
               <div key={torre}>

                  {/* Separador de torre */}
                  <div className="flex items-center gap-3 mb-3">
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex-shrink-0">
                        {torre}
                     </span>
                     <div className="h-px flex-1 bg-slate-100" />
                     <span className="text-[10px] text-slate-300 font-semibold flex-shrink-0">
                        {residentesFiltrados.filter(r => r.torre === torre).length} aptos
                     </span>
                  </div>

                  {/* Grid de tarjetas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                     {residentesFiltrados.filter(r => r.torre === torre).map(res => (
                        <div
                           key={res.id}
                           className="group bg-white border border-slate-200 rounded-xl p-3.5
                              flex flex-col gap-3 hover:border-emerald-200 hover:shadow-sm
                              transition-all duration-200"
                        >
                           {/* Fila 1: Badge apto + Info completa */}
                           <div className="flex items-start gap-3">
                              {/* Badge apto */}
                              <div className="w-10 h-10 bg-slate-100 group-hover:bg-emerald-50 rounded-lg
                                 flex items-center justify-center font-black text-[11px] text-slate-500
                                 group-hover:text-emerald-600 transition-colors flex-shrink-0 mt-0.5">
                                 {res.apartamento}
                              </div>

                              {/* Info — sin truncate para que siempre sea legible */}
                              <div className="flex-1 min-w-0">
                                 <p className="font-bold text-slate-900 text-sm leading-snug uppercase tracking-tight break-words">
                                    {res.nombre}
                                 </p>
                                 <div className="flex flex-col gap-0.5 mt-1">
                                    {res.celular && (
                                       <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                          <Phone size={9} className="flex-shrink-0" />
                                          {res.celular}
                                       </span>
                                    )}
                                    {res.email && (
                                       <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium break-all">
                                          <AtSign size={9} className="flex-shrink-0" />
                                          {res.email}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* Fila 2: Vehículos + Acciones */}
                           <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                              {/* Vehículos */}
                              <div className="flex items-center gap-3">
                                 <VehicleBadge icon={CarIcon} count={res.carros || 0} activeColor="text-emerald-500" />
                                 <VehicleBadge icon={MotoIcon} count={res.motos || 0} activeColor="text-amber-500" />
                                 <VehicleBadge icon={BikeIcon} count={res.bicis || 0} activeColor="text-blue-500" />
                              </div>

                              {/* Acciones */}
                              <div className="flex items-center gap-1">
                                 <button
                                    title="Editar"
                                    onClick={() => {
                                       setEditandoId(res.id);
                                       setForm({
                                          nombre: res.nombre, celular: res.celular || "",
                                          email: res.email || "", torre: res.torre,
                                          apto: res.apartamento, carros: res.carros || 0,
                                          motos: res.motos || 0, bicis: res.bicis || 0
                                       });
                                       setShowModal(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                 >
                                    <Edit size={14} />
                                 </button>
                                 <button
                                    title="Eliminar"
                                    onClick={async () => {
                                       if (confirm("¿Eliminar este residente?")) {
                                          await supabase.from("residentes").delete().eq("id", res.id);
                                          cargarResidentes();
                                       }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>

         {/* Estado vacío */}
         {residentesFiltrados.length === 0 && !loading && (
            <div className="text-center py-16 text-slate-300">
               <Users size={40} className="mx-auto mb-3 opacity-40" />
               <p className="text-sm font-semibold">No se encontraron residentes</p>
            </div>
         )}

         {/* ── MODAL ─────────────────────────────────────────────────────────── */}
         {showModal && (
            <div
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-6"
               onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
            >
               <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden
                  animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

                  <form onSubmit={manejarGuardar}>

                     {/* Header */}
                     <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 flex justify-between items-center border-b border-slate-100">
                        <div>
                           <h3 className="font-black text-slate-900 text-base sm:text-lg uppercase tracking-tight">
                              {editandoId ? "Editar Residente" : "Nuevo Residente"}
                           </h3>
                           <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {editandoId ? "Actualiza los datos del residente" : "Completa los datos para registrar"}
                           </p>
                        </div>
                        <button
                           type="button" onClick={() => setShowModal(false)}
                           className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                           <X size={18} />
                        </button>
                     </div>

                     {/* Cuerpo */}
                     <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-4 overflow-y-auto max-h-[70vh] sm:max-h-none">

                        {/* Nombre */}
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Nombre Completo *
                           </label>
                           <input
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                                 text-sm font-semibold uppercase text-slate-800
                                 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                              value={form.nombre}
                              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                              placeholder="Nombre completo" required
                           />
                        </div>

                        {/* Celular + Email */}
                        <div className="grid grid-cols-2 gap-3">
                           {[
                              { label: "Celular", key: "celular", type: "tel", placeholder: "312 000 0000" },
                              { label: "Email", key: "email", type: "email", placeholder: "correo@ejemplo.com" },
                           ].map(({ label, key, type, placeholder }) => (
                              <div key={key} className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                                 <input
                                    type={type}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                                       text-sm font-medium text-slate-800 placeholder:text-slate-300
                                       focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                    value={form[key as keyof typeof form] as string}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                    placeholder={placeholder}
                                 />
                              </div>
                           ))}
                        </div>

                        {/* Torre + Apto */}
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Torre *</label>
                              <div className="relative">
                                 <select
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                                       text-sm font-semibold text-slate-800
                                       focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                    value={form.torre}
                                    onChange={(e) => setForm({ ...form, torre: e.target.value, apto: "" })}
                                    required
                                 >
                                    <option value="">Seleccionar…</option>
                                    {Object.keys(ESTRUCTURA_TORRES).map(t => <option key={t} value={t}>{t}</option>)}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apartamento *</label>
                              <div className="relative">
                                 <select
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                                       text-sm font-semibold text-slate-800 disabled:opacity-40
                                       focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                    value={form.apto}
                                    onChange={(e) => setForm({ ...form, apto: e.target.value })}
                                    disabled={!form.torre} required
                                 >
                                    <option value="">Elegir apto…</option>
                                    {form.torre && ESTRUCTURA_TORRES[form.torre].map((a: any) => (
                                       <option key={a} value={a}>{a}</option>
                                    ))}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                        </div>

                        {/* Vehículos */}
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vehículos</label>
                           <div className="grid grid-cols-3 gap-2">
                              {[
                                 { key: "carros", label: "Carros", Icon: CarIcon, color: "text-emerald-500" },
                                 { key: "motos", label: "Motos", Icon: MotoIcon, color: "text-amber-500" },
                                 { key: "bicis", label: "Bicicletas", Icon: BikeIcon, color: "text-blue-500" },
                              ].map(({ key, label, Icon, color }) => (
                                 <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-2">
                                    <Icon size={16} className={color} />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
                                    <input
                                       type="number" inputMode="numeric" min={0} max={9}
                                       className="w-14 text-center bg-white border border-slate-200 rounded-lg py-1.5 font-black text-sm text-slate-700
                                          focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                                       value={form[key as keyof typeof form]}
                                       onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
                                    />
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Footer */}
                     <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6 flex gap-2.5 border-t border-slate-100">
                        <button
                           type="submit" disabled={guardando}
                           className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                              text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wide
                              transition-all shadow-md shadow-emerald-100 active:scale-95 disabled:opacity-60"
                        >
                           {guardando
                              ? <Loader2 className="animate-spin" size={16} />
                              : editandoId ? "Actualizar" : "Guardar Residente"
                           }
                        </button>
                        <button
                           type="button" onClick={() => setShowModal(false)}
                           className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-3 rounded-xl text-xs uppercase tracking-wide transition-colors"
                        >
                           Cancelar
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
