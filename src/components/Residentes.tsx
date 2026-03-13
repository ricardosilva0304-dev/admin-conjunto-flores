"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
   UserPlus, Search, Phone, MapPin,
   Car, Bike, Trash2, Edit, X, Loader2,
   Users, AtSign
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

const MotoIcon = ({ className, size = 14 }: { className?: string; size?: number }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="7" cy="18" r="3" /><circle cx="17" cy="18" r="3" />
      <path d="M12 18V9c0-2 1-3 3-3 1 0 2 .5 3 1.5" /><path d="M16 18H8" /><path d="M7 15c-1-2-1-4 1-5l4-2 2 3h4" />
   </svg>
);

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
         .order('torre', { ascending: true }).order('apartamento', { ascending: true });
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
         setShowModal(false); cargarResidentes();
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

   if (loading) return (
      <div className="flex h-64 items-center justify-center">
         <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
   );

   return (
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-24 font-sans text-slate-800 px-0">

         {/* ── CABECERA ─────────────────────────────────────────── */}
         <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
               <div className="flex items-center gap-2 sm:gap-3">
                  <Users size={18} className="text-emerald-500 flex-shrink-0" />
                  {/* Título en una sola línea — usa truncate en móvil */}
                  <h1 className="text-slate-800 font-black uppercase tracking-tight leading-none
                     text-lg sm:text-2xl">
                     Directorio Residentes
                  </h1>
               </div>
               {/* Stats en una sola fila, iconos pequeños */}
               <div className="mt-1.5 flex gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-wrap">
                  <span>{residentes.length} personas</span>
                  <span className="flex items-center gap-1">
                     <Car size={9} /> {residentes.reduce((a, r) => a + (r.carros || 0), 0)}
                  </span>
                  <span className="flex items-center gap-1">
                     <MotoIcon size={9} /> {residentes.reduce((a, r) => a + (r.motos || 0), 0)}
                  </span>
                  <span className="flex items-center gap-1">
                     <Bike size={9} /> {residentes.reduce((a, r) => a + (r.bicis || 0), 0)}
                  </span>
               </div>
            </div>

            <button
               onClick={() => {
                  setEditandoId(null);
                  setForm({ nombre: "", celular: "", email: "", torre: "", apto: "", carros: 0, motos: 0, bicis: 0 });
                  setShowModal(true);
               }}
               className="flex-shrink-0 bg-slate-900 text-white rounded-xl font-black tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-1.5
                  px-3 py-2.5 text-[9px]
                  sm:px-8 sm:py-3.5 sm:text-xs"
            >
               <UserPlus size={14} />
               <span className="hidden sm:inline">REGISTRAR NUEVO</span>
               <span className="sm:hidden">Nuevo</span>
            </button>
         </div>

         {/* ── FILTROS ──────────────────────────────────────────── */}
         <section className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col gap-2.5 shadow-sm">
            {/* Buscador */}
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
               <input
                  placeholder="Busca por Nombre o Apto (5-101)..."
                  className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3 sm:py-4 rounded-xl outline-none font-bold text-slate-600 text-sm focus:bg-white transition-all"
                  onChange={(e) => setBusqueda(e.target.value)}
               />
            </div>

            {/* Torres en grid fijo — sin scroll horizontal */}
            <div className="grid grid-cols-6 gap-1 bg-slate-50 rounded-xl p-1">
               {[
                  { key: "TODAS", label: "Todo" },
                  { key: "Torre 1", label: "T-1" },
                  { key: "Torre 5", label: "T-5" },
                  { key: "Torre 6", label: "T-6" },
                  { key: "Torre 7", label: "T-7" },
                  { key: "Torre 8", label: "T-8" },
               ].map(({ key, label }) => (
                  <button
                     key={key}
                     onClick={() => setFiltroTorre(key)}
                     className={`py-2 rounded-lg text-[9px] sm:text-[10px] font-black tracking-widest transition-all ${filtroTorre === key
                           ? "bg-emerald-600 text-white shadow-lg"
                           : "text-slate-400 hover:bg-slate-200"
                        }`}
                  >
                     {label}
                  </button>
               ))}
            </div>
         </section>

         {/* ── LISTADO POR TORRE ────────────────────────────────── */}
         <div className="space-y-6 sm:space-y-10">
            {Array.from(new Set(residentesFiltrados.map(r => r.torre))).sort().map(torre => (
               <div key={torre} className="space-y-2 sm:space-y-3">

                  {/* Separador de torre */}
                  <div className="flex items-center gap-3 px-1">
                     <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        {torre}
                     </span>
                     <div className="h-px w-full bg-slate-100" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                     {residentesFiltrados.filter(r => r.torre === torre).map(res => (
                        <div
                           key={res.id}
                           className="bg-white border border-slate-200 p-3.5 sm:p-5 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors gap-2"
                        >
                           {/* Número de apto + info */}
                           <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                              <div className="w-10 h-10 sm:w-12 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center font-black text-[11px] sm:text-xs text-slate-500 flex-shrink-0">
                                 {res.apartamento}
                              </div>
                              <div className="min-w-0">
                                 <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate uppercase tracking-tight">
                                    {res.nombre}
                                 </h4>
                                 {/* Contacto — solo teléfono en móvil, email en sm+ */}
                                 <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                    <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                                       <Phone size={9} /> {res.celular || '--'}
                                    </span>
                                    <span className="hidden sm:flex text-[9px] font-medium text-slate-400 items-center gap-1">
                                       <AtSign size={9} /> {res.email || '--'}
                                    </span>
                                 </div>
                              </div>
                           </div>

                           {/* Vehículos + acciones */}
                           <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                              {/* Vehículos — compactos en móvil */}
                              <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-100 pl-2 sm:pl-4">
                                 <div className="text-center">
                                    <Car size={12} className={res.carros > 0 ? "text-emerald-500" : "text-slate-200"} />
                                    <span className="text-[8px] font-black block text-slate-600">{res.carros}</span>
                                 </div>
                                 <div className="text-center">
                                    <MotoIcon size={12} className={res.motos > 0 ? "text-amber-500" : "text-slate-200"} />
                                    <span className="text-[8px] font-black block text-slate-600">{res.motos}</span>
                                 </div>
                                 <div className="text-center hidden xs:block">
                                    <Bike size={12} className={res.bicis > 0 ? "text-blue-500" : "text-slate-200"} />
                                    <span className="text-[8px] font-black block text-slate-600">{res.bicis}</span>
                                 </div>
                              </div>

                              {/* Botones editar/eliminar */}
                              <div className="flex gap-0.5 sm:gap-1">
                                 <button
                                    onClick={() => {
                                       setEditandoId(res.id);
                                       setForm({ nombre: res.nombre, celular: res.celular || "", email: res.email || "", torre: res.torre, apto: res.apartamento, carros: res.carros || 0, motos: res.motos || 0, bicis: res.bicis || 0 });
                                       setShowModal(true);
                                    }}
                                    className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                 >
                                    <Edit size={14} />
                                 </button>
                                 <button
                                    onClick={async () => {
                                       if (confirm("¿Eliminar residente?")) {
                                          await supabase.from("residentes").delete().eq("id", res.id);
                                          cargarResidentes();
                                       }
                                    }}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
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

         {/* ── MODAL REGISTRO ───────────────────────────────────── */}
         {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
               <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300">
                  <form onSubmit={manejarGuardar} className="p-5 sm:p-8 space-y-4 sm:space-y-6">

                     {/* Header modal */}
                     <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-slate-100">
                        <h3 className="font-black text-lg sm:text-xl text-slate-900 uppercase tracking-tighter italic">
                           {editandoId ? "Actualizar Residente" : "Registro Habitacional"}
                        </h3>
                        <button type="button" onClick={() => setShowModal(false)} className="text-slate-300 p-1.5 hover:text-rose-500 transition-colors">
                           <X size={20} />
                        </button>
                     </div>

                     <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nombre Completo</label>
                           <input
                              className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-xl outline-none font-bold uppercase text-sm"
                              value={form.nombre}
                              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                              placeholder="NOMBRE COMPLETO" required
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Celular</label>
                              <input
                                 type="number" inputMode="numeric"
                                 className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl outline-none font-bold text-sm"
                                 value={form.celular}
                                 onChange={(e) => setForm({ ...form, celular: e.target.value })}
                                 placeholder="312 000 0000"
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Email</label>
                              <input
                                 type="email"
                                 className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl outline-none font-bold text-sm"
                                 value={form.email}
                                 onChange={(e) => setForm({ ...form, email: e.target.value })}
                                 placeholder="usuario@gmail.com"
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Torre</label>
                              <select
                                 className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl outline-none font-black appearance-none text-sm"
                                 value={form.torre}
                                 onChange={(e) => setForm({ ...form, torre: e.target.value, apto: "" })}
                                 required
                              >
                                 <option value="">Seleccione...</option>
                                 {Object.keys(ESTRUCTURA_TORRES).map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Apartamento</label>
                              <select
                                 className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl outline-none font-black appearance-none text-sm"
                                 value={form.apto}
                                 onChange={(e) => setForm({ ...form, apto: e.target.value })}
                                 disabled={!form.torre} required
                              >
                                 <option value="">Elegir Apto...</option>
                                 {form.torre && ESTRUCTURA_TORRES[form.torre].map((a: any) => <option key={a} value={a}>{a}</option>)}
                              </select>
                           </div>
                        </div>

                        {/* Vehículos */}
                        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl flex items-center justify-around gap-3 text-center border border-slate-100">
                           {['carros', 'motos', 'bicis'].map((tipo) => (
                              <div key={tipo} className="flex flex-col items-center gap-1.5">
                                 <p className="text-[8px] font-black text-slate-400 uppercase">{tipo}</p>
                                 <input
                                    type="number" inputMode="numeric"
                                    className="w-16 sm:w-20 bg-white border border-slate-200 p-2 rounded-lg text-center font-black text-sm"
                                    value={form[tipo as keyof typeof form]}
                                    onChange={(e) => setForm({ ...form, [tipo]: parseInt(e.target.value) || 0 })}
                                 />
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                        <button
                           type="submit" disabled={guardando}
                           className="flex-1 bg-slate-900 text-white font-black py-3.5 sm:py-4 rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.1em] hover:bg-emerald-600 transition-all"
                        >
                           {guardando ? <Loader2 className="animate-spin mx-auto" size={18} /> : "GUARDAR RESIDENTE"}
                        </button>
                        <button
                           type="button" onClick={() => setShowModal(false)}
                           className="px-5 sm:px-6 bg-slate-100 text-slate-400 font-bold py-3.5 sm:py-4 rounded-xl text-[10px] sm:text-xs uppercase tracking-widest"
                        >
                           Salir
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}