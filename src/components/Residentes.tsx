"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  UserPlus, Search, Phone, MapPin, 
  Car, Bike, Trash2, Edit, X, Loader2, 
  Users, AtSign, ChevronRight, Info
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

  const [form, setForm] = useState({
    nombre: "", celular: "", email: "", torre: "", apto: "", 
    carros: 0, motos: 0, bicis: 0
  });

  useEffect(() => { cargarResidentes(); }, []);

  async function cargarResidentes() {
    setLoading(true);
    const { data } = await supabase.from("residentes").select("*").order('torre', { ascending: true }).order('apartamento', { ascending: true });
    if (data) setResidentes(data);
    setLoading(false);
  }

  async function manejarGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.torre || !form.apto) return alert("Faltan datos");
    setGuardando(true);
    const payload = { nombre: form.nombre, celular: form.celular, email: form.email, torre: form.torre, apartamento: form.apto, carros: Number(form.carros) || 0, motos: Number(form.motos) || 0, bicis: Number(form.bicis) || 0 };
    const action = editandoId ? supabase.from("residentes").update(payload).eq("id", editandoId) : supabase.from("residentes").insert([payload]);
    const { error } = await action;
    if (!error) { setShowModal(false); cargarResidentes(); }
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

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-1000">
      
      {/* HEADER PREMIUM */}
      <div className="flex items-end justify-between border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Users size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gestión de Comunidad</span>
          </div>
          <h1 className="text-slate-900 text-4xl font-black tracking-tight">Residentes</h1>
        </div>
        <button 
          onClick={() => { setEditandoId(null); setForm({nombre:"", celular:"", email:"", torre:"", apto:"", carros:0, motos:0, bicis:0}); setShowModal(true); }}
          className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          <UserPlus size={18} /> Registrar Nuevo
        </button>
      </div>

      {/* BARRA DE HERRAMIENTAS (SEARCH & FILTERS) */}
      <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nombre o unidad (ej: 5-101)..."
            className="w-full bg-transparent pl-12 pr-4 py-4 outline-none font-medium text-slate-600 placeholder:text-slate-300"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1 w-full md:w-auto overflow-x-auto">
          {["TODAS", "1", "5", "6", "7", "8"].map(t => (
            <button 
              key={t}
              onClick={() => setFiltroTorre(t === "TODAS" ? "TODAS" : `Torre ${t}`)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
                (filtroTorre === "TODAS" && t === "TODAS") || filtroTorre === `Torre ${t}`
                  ? "bg-white text-emerald-600 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t === "TODAS" ? "TODAS" : `T${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO TIPO LISTA PREMIUM */}
      <div className="space-y-12 pb-24">
        {Array.from(new Set(residentesFiltrados.map(r => r.torre))).sort().map(torre => (
          <div key={torre} className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-6 px-2">
              <h2 className="text-slate-900 font-black text-sm uppercase tracking-[0.2em]">{torre}</h2>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
              <span className="text-[10px] font-bold text-slate-300 italic">
                {residentesFiltrados.filter(r => r.torre === torre).length} registros
              </span>
            </div>

            <div className="grid gap-3">
              {residentesFiltrados.filter(r => r.torre === torre).map(res => (
                <div key={res.id} className="bg-white border border-slate-100 hover:border-emerald-200 p-5 rounded-2xl flex items-center justify-between transition-all group hover:shadow-lg hover:shadow-emerald-500/5">
                  <div className="flex items-center gap-6 w-1/2">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      {res.apartamento}
                    </div>
                    <div className="truncate">
                      <h4 className="text-slate-900 font-bold text-base truncate">{res.nombre}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-slate-400 text-[10px] flex items-center gap-1 font-medium"><Phone size={10}/> {res.celular || "---"}</span>
                        {res.email && <span className="text-slate-400 text-[10px] flex items-center gap-1 font-medium"><AtSign size={10}/> {res.email}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 px-8">
                    <div className={`flex flex-col items-center gap-1 ${res.carros > 0 ? "text-emerald-500" : "text-slate-200"}`}>
                      <Car size={14} />
                      <span className="text-[10px] font-black">{res.carros || 0}</span>
                    </div>
                    <div className={`flex flex-col items-center gap-1 ${res.motos > 0 ? "text-amber-500" : "text-slate-200"}`}>
                      <span className="text-[8px] font-black uppercase">Moto</span>
                      <span className="text-[10px] font-black">{res.motos || 0}</span>
                    </div>
                    <div className={`flex flex-col items-center gap-1 ${res.bicis > 0 ? "text-blue-500" : "text-slate-200"}`}>
                      <Bike size={14} />
                      <span className="text-[10px] font-black">{res.bicis || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => { setEditandoId(res.id); setForm({nombre:res.nombre, celular:res.celular||"", email:res.email||"", torre:res.torre, apto:res.apartamento, carros:res.carros||0, motos:res.motos||0, bicis:res.bicis||0}); setShowModal(true); }} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit size={16}/></button>
                    <button onClick={async () => { if(confirm("¿Eliminar?")) { await supabase.from("residentes").delete().eq("id", res.id); cargarResidentes(); } }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL REFINADO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={manejarGuardar} className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-slate-900 text-xl font-black uppercase tracking-tight">{editandoId ? "Editar Residente" : "Nuevo Residente"}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-900"><X size={24}/></button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-emerald-500 font-bold" value={form.nombre} onChange={(e)=>setForm({...form, nombre: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Celular</label>
                    <input className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none" value={form.celular} onChange={(e)=>setForm({...form, celular: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Email</label>
                    <input type="email" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Torre</label>
                    <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold appearance-none" value={form.torre} onChange={(e)=>setForm({...form, torre: e.target.value, apto: ""})}>
                      <option value="">Seleccionar...</option>
                      {Object.keys(ESTRUCTURA_TORRES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Apto</label>
                    <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none font-bold appearance-none" value={form.apto} onChange={(e)=>setForm({...form, apto: e.target.value})} disabled={!form.torre}>
                      <option value="">Elegir...</option>
                      {form.torre && ESTRUCTURA_TORRES[form.torre].map((a:any) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">Carros</label>
                    <input type="number" className="w-full bg-white p-2 rounded-lg text-center font-black" value={form.carros} onChange={(e)=>setForm({...form, carros: parseInt(e.target.value)||0})} />
                  </div>
                  <div className="text-center">
                    <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">Motos</label>
                    <input type="number" className="w-full bg-white p-2 rounded-lg text-center font-black" value={form.motos} onChange={(e)=>setForm({...form, motos: parseInt(e.target.value)||0})} />
                  </div>
                  <div className="text-center">
                    <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">Bicis</label>
                    <input type="number" className="w-full bg-white p-2 rounded-lg text-center font-black" value={form.bicis} onChange={(e)=>setForm({...form, bicis: parseInt(e.target.value)||0})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button type="submit" disabled={guardando} className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2">
                  {guardando ? <Loader2 className="animate-spin" size={20}/> : "GUARDAR RESIDENTE"}
                </button>
                <button type="button" onClick={()=>setShowModal(false)} className="px-8 bg-slate-100 text-slate-400 font-bold py-5 rounded-2xl">SALIR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}