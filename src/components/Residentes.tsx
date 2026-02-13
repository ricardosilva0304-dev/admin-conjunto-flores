"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
   UserPlus, Search, Phone, MapPin,
   Car, Bike, Trash2, Edit, X, Loader2,
   Users, AtSign
} from "lucide-react";

const ESTRUCTURA_TORRES: any = {
   "Torre 1": ["101", "102", "103", "104", "105", "106", "107"],
   "Torre 5": generarAptosEstandar(),
   "Torre 6": generarAptosEstandar(),
   "Torre 7": generarAptosEstandar(),
   "Torre 8": generarAptosEstandar(),
};

function generarAptosEstandar() {
   let aptos = [];
   for (let piso = 1; piso <= 6; piso++) {
      for (let apto = 1; apto <= 4; apto++) {
         aptos.push(`${piso}0${apto}`);
      }
   }
   return aptos;
}

export default function Residentes() {
   const [residentes, setResidentes] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [guardando, setGuardando] = useState(false);
   const [busqueda, setBusqueda] = useState("");
   const [filtroTorre, setFiltroTorre] = useState("TODAS");
   const [showModal, setShowModal] = useState(false);
   const [editandoId, setEditandoId] = useState<number | null>(null);

   const MotoIcon = ({ className, size = 14 }: { className?: string, size?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
         <circle cx="7" cy="18" r="3" /><circle cx="17" cy="18" r="3" />
         <path d="M12 18V9c0-2 1-3 3-3 1 0 2 .5 3 1.5" /><path d="M16 18H8" /><path d="M7 15c-1-2-1-4 1-5l4-2 2 3h4" />
      </svg>
   );

   const [form, setForm] = useState({
      nombre: "", celular: "", email: "", torre: "", apto: "",
      carros: 0, motos: 0, bicis: 0
   });

   useEffect(() => { cargarResidentes(); }, []);

   async function cargarResidentes() {
      setLoading(true);
      const { data } = await supabase.from("residentes").select("*")
         .order('torre', { ascending: true })
         .order('apartamento', { ascending: true });
      if (data) setResidentes(data);
      setLoading(false);
   }

   async function manejarGuardar(e: React.FormEvent) {
      e.preventDefault();
      if (!form.nombre || !form.torre || !form.apto) return alert("Llena los datos obligatorios");

      // --- MEJORA: VALIDACIÓN DE DUPLICADOS ---
      // Si estamos creando uno nuevo, verificamos que el apto no esté ya registrado
      if (!editandoId) {
         const existe = residentes.find(r => r.torre === form.torre && r.apartamento === form.apto);
         if (existe) {
            return alert(`⚠️ La unidad ${form.torre} - ${form.apto} ya está registrada a nombre de ${existe.nombre}.`);
         }
      }

      setGuardando(true);
      const payload = {
         nombre: form.nombre.trim().toUpperCase(),
         celular: form.celular,
         email: form.email.trim().toLowerCase(),
         torre: form.torre,
         apartamento: form.apto,
         carros: Number(form.carros) || 0,
         motos: Number(form.motos) || 0,
         bicis: Number(form.bicis) || 0
      };

      const action = editandoId
         ? supabase.from("residentes").update(payload).eq("id", editandoId)
         : supabase.from("residentes").insert([payload]);

      const { error } = await action;
      if (!error) {
         setShowModal(false);
         cargarResidentes();
         setForm({ nombre: "", celular: "", email: "", torre: "", apto: "", carros: 0, motos: 0, bicis: 0 });
      } else {
         alert("Error al guardar: " + error.message);
      }
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

   if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

   return (
      <div className="max-w-6xl mx-auto space-y-6 pb-24 font-sans text-slate-800">

         {/* CABECERA Y RESUMEN TÉCNICO */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200">
            <div>
               <div className="flex items-center gap-3">
                  <Users size={22} className="text-emerald-500" />
                  <h1 className="text-slate-800 text-2xl font-black uppercase tracking-tight">Directorio Residentes</h1>
               </div>
               <div className="mt-1 flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Personas: {residentes.length}</span>
                  <span className="flex items-center gap-1"><Car size={10} /> {residentes.reduce((a, r) => a + (r.carros || 0), 0)}</span>
                  <span className="flex items-center gap-1"><MotoIcon size={10} /> {residentes.reduce((a, r) => a + (r.motos || 0), 0)}</span>
                  <span className="flex items-center gap-1"><Bike size={10} /> {residentes.reduce((a, r) => a + (r.bicis || 0), 0)}</span>
               </div>
            </div>
            <button
               onClick={() => { setEditandoId(null); setForm({ nombre: "", celular: "", email: "", torre: "", apto: "", carros: 0, motos: 0, bicis: 0 }); setShowModal(true); }}
               className="bg-slate-900 text-white px-8 py-3.5 rounded-lg text-xs font-black tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
               <UserPlus size={16} /> REGISTRAR NUEVO
            </button>
         </div>

         {/* FILTROS Y BUSQUEDA */}
         <section className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input
                  placeholder="Busca por Nombre o Apto (5-101)..."
                  className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-xl outline-none font-bold text-slate-600 focus:bg-white transition-all"
                  onChange={(e) => setBusqueda(e.target.value)}
               />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar p-1">
               {["TODAS", "1", "5", "6", "7", "8"].map(t => (
                  <button
                     key={t}
                     onClick={() => setFiltroTorre(t === "TODAS" ? "TODAS" : `Torre ${t}`)}
                     className={`px-6 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${(filtroTorre === "TODAS" && t === "TODAS") || filtroTorre === `Torre ${t}`
                        ? "bg-emerald-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"
                        }`}
                  >
                     {t === "TODAS" ? "TODO" : `T-${t}`}
                  </button>
               ))}
            </div>
         </section>

         {/* LISTADO ORGANIZADO POR TORRE */}
         <div className="space-y-10">
            {Array.from(new Set(residentesFiltrados.map(r => r.torre))).sort().map(torre => (
               <div key={torre} className="space-y-3">
                  <div className="flex items-center gap-4 px-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{torre}</span>
                     <div className="h-px w-full bg-slate-100"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {residentesFiltrados.filter(r => r.torre === torre).map(res => (
                        <div key={res.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                           <div className="flex items-center gap-5 w-3/5">
                              <div className="w-12 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-black text-xs text-slate-400 shrink-0">
                                 {res.apartamento}
                              </div>
                              <div className="min-w-0">
                                 <h4 className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">{res.nombre}</h4>
                                 <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Phone size={10} /> {res.celular || '--'}</span>
                                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><AtSign size={10} /> {res.email || '--'}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
                              <div className="text-center">
                                 <Car size={14} className={res.carros > 0 ? "text-emerald-500" : "text-slate-200"} />
                                 <span className="text-[9px] font-black block mt-0.5 text-slate-900">{res.carros}</span>
                              </div>
                              <div className="text-center">
                                 <MotoIcon size={14} className={res.motos > 0 ? "text-amber-500" : "text-slate-200"} />
                                 <span className="text-[9px] font-black block mt-0.5 text-slate-900">{res.motos}</span>
                              </div>
                              <div className="text-center">
                                 <Bike size={14} className={res.bicis > 0 ? "text-blue-500" : "text-slate-200"} />
                                 <span className="text-[9px] font-black block mt-0.5 text-slate-900">{res.bicis}</span>
                              </div>
                           </div>

                           <div className="flex gap-1 pl-4">
                              <button onClick={() => { setEditandoId(res.id); setForm({ nombre: res.nombre, celular: res.celular || "", email: res.email || "", torre: res.torre, apto: res.apartamento, carros: res.carros || 0, motos: res.motos || 0, bicis: res.bicis || 0 }); setShowModal(true); }} className="p-3 text-slate-300 hover:text-emerald-600 transition-colors"><Edit size={16} /></button>
                              <button onClick={async () => { if (confirm("¿Eliminar residente?")) { await supabase.from("residentes").delete().eq("id", res.id); cargarResidentes(); } }} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>

         {/* MODAL REGISTRO */}
         {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex flex-col items-center justify-end md:justify-center p-0 md:p-4">
               <div className="bg-white w-full max-w-2xl rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-6">
                  <form onSubmit={manejarGuardar} className="p-8 space-y-6">
                     <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <h3 className="font-black text-xl text-slate-900 uppercase tracking-tighter italic">{editandoId ? "Actualizar Residente" : "Registro Habitacional"}</h3>
                        <button type="button" onClick={() => setShowModal(false)} className="text-slate-300 p-2"><X /></button>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nombre Completo</label>
                           <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold uppercase" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="NOMBRE COMPLETO" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Celular</label>
                              <input type="number" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold" value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} placeholder="312 000 0000" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Email</label>
                              <input type="email" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="usuario@gmail.com" />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Torre</label>
                              <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-black appearance-none" value={form.torre} onChange={(e) => setForm({ ...form, torre: e.target.value, apto: "" })} required>
                                 <option value="">Seleccione...</option>
                                 {Object.keys(ESTRUCTURA_TORRES).map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Apartamento</label>
                              <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-black appearance-none" value={form.apto} onChange={(e) => setForm({ ...form, apto: e.target.value })} disabled={!form.torre} required>
                                 <option value="">Elegir Apto...</option>
                                 {form.torre && ESTRUCTURA_TORRES[form.torre].map((a: any) => <option key={a} value={a}>{a}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-around gap-4 text-center border border-slate-100">
                           {['carros', 'motos', 'bicis'].map((tipo) => (
                              <div key={tipo}>
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-2">{tipo}</p>
                                 <input type="number" className="w-20 bg-white border border-slate-200 p-2 rounded-lg text-center font-black" value={form[tipo as keyof typeof form]} onChange={(e) => setForm({ ...form, [tipo]: parseInt(e.target.value) || 0 })} />
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="flex gap-3 pt-6 border-t border-slate-100">
                        <button type="submit" disabled={guardando} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-xl text-xs uppercase tracking-[0.1em] hover:bg-emerald-600 transition-all">
                           {guardando ? <Loader2 className="animate-spin" /> : "GUARDAR RESIDENTE"}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="px-6 bg-slate-100 text-slate-400 font-bold py-4 rounded-xl text-xs uppercase tracking-widest">Salir</button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}