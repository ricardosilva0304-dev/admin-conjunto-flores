"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  X, Loader2, Sun, Moon, Flame, Search, 
  Trash2, DollarSign, BarChart3
} from "lucide-react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO 
} from "date-fns";
import { es } from "date-fns/locale";

export default function ZonasComunes() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservas, setReservas] = useState<any[]>([]);
  const [residentes, setResidentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  const [searchRes, setSearchRes] = useState("");
  const [resSeleccionado, setResSeleccionado] = useState<any>(null);
  const [zona, setZona] = useState("Salón Comunal");
  const [jornada, setJornada] = useState("Día");
  const [fecha, setFecha] = useState("");
  const [costo, setCosto] = useState("");

  useEffect(() => { cargarDatos(); }, [currentMonth]);

  async function cargarDatos() {
    setLoading(true);
    try {
      const [resRes, resSrv] = await Promise.all([
        supabase.from("residentes").select("*"),
        supabase.from("reservas").select("*")
      ]);
      if (resRes.data) setResidentes(resRes.data);
      if (resSrv.data) setReservas(resSrv.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const sugerencias = searchRes.length > 1 ? residentes.filter(r => {
    const term = searchRes.toLowerCase();
    const unidad = `T${r.torre.slice(-1)}-${r.apartamento}`;
    return r.nombre.toLowerCase().includes(term) || unidad.toLowerCase().includes(term);
  }).slice(0, 4) : [];

  async function manejarReserva(e: React.FormEvent) {
    e.preventDefault();
    if (!resSeleccionado || !fecha) return alert("Faltan datos obligatorios.");

    // Validar conflicto de horario
    const conflicto = reservas.find(r => 
      r.fecha === fecha && 
      r.zona === zona && 
      (r.jornada === jornada || r.jornada === "Día Completo")
    );

    if (conflicto) return alert("⚠️ Ya existe una reserva para este espacio y jornada en esa fecha.");

    setGuardando(true);
    const { error } = await supabase.from("reservas").insert([{
      residente_nombre: resSeleccionado.nombre.toUpperCase(),
      residente_unidad: `T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}`,
      zona,
      fecha,
      jornada: zona === "Salón Comunal" ? jornada : "Día Completo",
      costo: parseFloat(costo) || 0
    }]);

    if (!error) {
      setResSeleccionado(null); setSearchRes(""); setFecha(""); setCosto("");
      cargarDatos();
    } else {
      alert("Error al guardar la reserva.");
    }
    setGuardando(false);
  }

  const reservasDelMes = reservas.filter(r => isSameMonth(parseISO(r.fecha), currentMonth));
  const totalRecaudado = reservasDelMes.reduce((acc, r) => acc + (Number(r.costo) || 0), 0);
  const countSalon = reservasDelMes.filter(r => r.zona === 'Salón Comunal').length;
  const countBBQ = reservasDelMes.filter(r => r.zona === 'BBQ').length;

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dFmt = format(day, "yyyy-MM-dd");
        const listRes = reservas.filter(r => r.fecha === dFmt);
        const hoy = isSameDay(day, new Date());

        days.push(
          <div key={day.toString()} className={`min-h-[120px] border-r border-b border-slate-100 p-2 flex flex-col gap-1 transition-all ${!isSameMonth(day, monthStart) ? "bg-slate-50/20 opacity-20" : "bg-white hover:bg-slate-50/40"}`}>
            <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-black rounded-md mb-1 ${hoy ? "bg-emerald-600 text-white shadow-lg" : "text-slate-300"}`}>
              {format(day, "d")}
            </div>
            
            <div className="space-y-1">
              {listRes.map(r => (
                <div key={r.id} className={`p-1.5 rounded-lg border text-[8px] font-black uppercase flex flex-col group relative ${r.zona === "BBQ" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
                   <div className="flex justify-between items-center">
                     <span>{r.residente_unidad}</span>
                     {r.jornada === 'Día' ? <Sun size={8}/> : r.jornada === 'Noche' ? <Moon size={8}/> : <Flame size={8}/>}
                   </div>
                   <p className="truncate opacity-80 mt-0.5">{r.residente_nombre.split(' ')[0]}</p>
                   
                   <button onClick={async()=> {if(confirm("¿Eliminar reserva?")){await supabase.from("reservas").delete().eq("id", r.id); cargarDatos();}}} className="absolute inset-0 bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10">
                      <Trash2 size={12}/>
                   </button>
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div className="border-t border-slate-100">{rows}</div>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans text-slate-800">
      
      {/* GESTIÓN DE AGUENDAMIENTO */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={manejarReserva} className="flex flex-col xl:flex-row items-center gap-4">
          
          <div className="flex-1 w-full relative">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Responsable de Unidad</label>
             <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  placeholder="Buscar Apto o Nombre..."
                  className="w-full bg-slate-50 border border-slate-100 p-3 pl-10 rounded-xl outline-none font-bold text-slate-700 text-sm focus:bg-white transition-all"
                  value={resSeleccionado ? `${resSeleccionado.nombre} | T${resSeleccionado.torre.slice(-1)}-${resSeleccionado.apartamento}` : searchRes}
                  onChange={(e)=> {setSearchRes(e.target.value); setResSeleccionado(null);}}
                />
                {resSeleccionado && <button type="button" onClick={()=>{setResSeleccionado(null); setSearchRes("");}} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X size={16}/></button>}
             </div>
             
             {sugerencias.length > 0 && (
               <div className="absolute top-[105%] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-[150] overflow-hidden">
                  {sugerencias.map(r => (
                    <button key={r.id} type="button" onClick={()=>{setResSeleccionado(r); setSearchRes("");}} className="w-full p-4 text-left hover:bg-slate-50 flex items-center justify-between border-b last:border-0 font-bold text-xs">
                      <span className="uppercase">{r.nombre}</span>
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black">T{r.torre.slice(-1)}-{r.apartamento}</span>
                    </button>
                  ))}
               </div>
             )}
          </div>

          <div className="w-full xl:w-48">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Zona</label>
             <div className="flex bg-slate-50 p-1 rounded-xl border">
               {['Salón Comunal', 'BBQ'].map(z => (
                 <button key={z} type="button" onClick={()=>setZona(z)} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${zona === z ? "bg-white text-slate-900 shadow-sm border" : "text-slate-400 uppercase"}`}>
                   {z === 'Salón Comunal' ? 'SALÓN' : 'BBQ'}
                 </button>
               ))}
             </div>
          </div>

          {zona === "Salón Comunal" && (
            <div className="w-full xl:w-32 animate-in zoom-in-95">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Horario</label>
               <div className="flex bg-slate-100 p-1 rounded-xl border">
                 {['Día', 'Noche'].map(j => (
                   <button key={j} type="button" onClick={()=>setJornada(j)} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${jornada === j ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 uppercase"}`}>
                      {j}
                   </button>
                 ))}
               </div>
            </div>
          )}

          <div className="w-full xl:w-40">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Fecha Reserva</label>
             <input type="date" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold text-sm outline-none" value={fecha} onChange={(e)=>setFecha(e.target.value)} required />
          </div>

          <div className="w-full xl:w-36 relative">
             <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1 mb-1 block">Costo de Uso</label>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                <input type="number" placeholder="0" className="w-full bg-emerald-50 border border-emerald-100 p-3 pl-7 rounded-xl font-black text-emerald-700 outline-none" value={costo} onChange={(e)=>setCosto(e.target.value)} />
             </div>
          </div>

          <button type="submit" disabled={guardando} className="w-full xl:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-black active:scale-95 shadow-lg shadow-slate-900/10">
             {guardando ? <Loader2 className="animate-spin" size={14} /> : "AGENDAR"}
          </button>
        </form>
      </section>

      {/* CALENDARIO MENSUAL */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[600px]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100"><CalendarIcon size={24} /></div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{format(currentMonth, "MMMM yyyy", { locale: es })}</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disponibilidad de zonas</p>
              </div>
           </div>

           <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400"><ChevronLeft size={20}/></button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400"><ChevronRight size={20}/></button>
           </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/40">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center italic opacity-20"><Loader2 className="animate-spin text-slate-900" size={32}/></div>
        ) : renderCells()}
      </div>

      {/* KPI RESERVAS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Recaudo Estimado</p>
               <h3 className="text-3xl font-black tabular-nums">${totalRecaudado.toLocaleString()}</h3>
            </div>
            <DollarSign size={32} className="opacity-20" />
         </div>

         <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Uso del Salón</p>
            <h3 className="text-2xl font-black text-slate-800">{countSalon} <span className="text-xs text-slate-400 font-bold uppercase">Eventos</span></h3>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-blue-500" style={{width: `${Math.min(100, countSalon * 10)}%`}}></div>
            </div>
         </div>

         <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Uso de BBQ</p>
            <h3 className="text-2xl font-black text-slate-800">{countBBQ} <span className="text-xs text-slate-400 font-bold uppercase">Reservas</span></h3>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-amber-500" style={{width: `${Math.min(100, countBBQ * 10)}%`}}></div>
            </div>
         </div>
      </section>

    </div>
  );
}