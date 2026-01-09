"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Calendar as CalendarIcon, User, ChevronLeft, ChevronRight, 
  X, Loader2, Sun, Moon, Flame, Search, CheckCircle2, Clock
} from "lucide-react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays 
} from "date-fns";
import { es } from "date-fns/locale";

export default function ZonasComunes() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservas, setReservas] = useState<any[]>([]);
  const [residentes, setResidentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Estados del Formulario
  const [searchResidente, setSearchResidente] = useState("");
  const [residenteSeleccionado, setResidenteSeleccionado] = useState<any>(null);
  const [zona, setZona] = useState("");
  const [fecha, setFecha] = useState("");
  const [jornada, setJornada] = useState("Día");

  useEffect(() => { cargarDatos(); }, [currentMonth]);

  async function cargarDatos() {
    setLoading(true);
    const { data: resData } = await supabase.from("residentes").select("*");
    const { data: rsvData } = await supabase.from("reservas").select("*");
    if (resData) setResidentes(resData);
    if (rsvData) setReservas(rsvData);
    setLoading(false);
  }

  const residentesSugeridos = searchResidente.length > 1 ? residentes.filter(r => {
    const term = searchResidente.toLowerCase();
    if (term.includes("-")) {
      const [t, a] = term.split("-");
      return r.torre.includes(t) && r.apartamento.startsWith(a);
    }
    return r.nombre.toLowerCase().includes(term) || r.apartamento.includes(term);
  }).slice(0, 5) : [];

  async function hacerReserva(e: React.FormEvent) {
    e.preventDefault();
    if (!residenteSeleccionado || !zona || !fecha) return alert("Completa todos los datos");
    setGuardando(true);
    
    const { error } = await supabase.from("reservas").insert([{
      residente_nombre: residenteSeleccionado.nombre,
      residente_unidad: `${residenteSeleccionado.torre.replace("Torre ", "")}-${residenteSeleccionado.apartamento}`,
      zona: zona,
      fecha: fecha,
      jornada: zona === "Salón Comunal" ? jornada : "Todo el día"
    }]);

    if (!error) {
      setResidenteSeleccionado(null);
      setSearchResidente("");
      setZona("");
      cargarDatos();
    }
    setGuardando(false);
  }

  // --- COMPONENTES DE INTERFAZ ---

  const renderDaysHeader = () => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return (
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {days.map(d => (
          <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-100 last:border-0">
            {d}
          </div>
        ))}
      </div>
    );
  };

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
        const formattedDate = format(day, "yyyy-MM-dd");
        const reservasDelDia = reservas.filter(r => r.fecha === formattedDate);
        const esHoy = isSameDay(day, new Date());
        
        days.push(
          <div key={day.toString()} className={`min-h-[140px] border-r border-b border-slate-100 p-3 transition-all relative ${!isSameMonth(day, monthStart) ? "bg-slate-50/20 opacity-30" : "bg-white hover:bg-slate-50/50"}`}>
            <div className={`flex items-center justify-center w-7 h-7 text-xs font-black rounded-lg mb-2 ${esHoy ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "text-slate-300"}`}>
              {format(day, "d")}
            </div>
            
            <div className="space-y-1.5">
              {reservasDelDia.map(r => (
                <div key={r.id} className={`p-2 rounded-xl border shadow-sm animate-in fade-in zoom-in-95 duration-300 ${
                  r.zona === "BBQ" ? "bg-amber-50 border-amber-100 text-amber-700" : "bg-blue-50 border-blue-100 text-blue-700"
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase tracking-tighter">{r.residente_unidad}</span>
                    {r.jornada === 'Día' ? <Sun size={10} /> : r.jornada === 'Noche' ? <Moon size={10} /> : <Flame size={10} />}
                  </div>
                  <p className="text-[9px] font-bold leading-none truncate">{r.residente_nombre}</p>
                  <p className="text-[8px] mt-1 opacity-60 font-black uppercase tracking-widest">{r.jornada}</p>
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
    return <div className="bg-white">{rows}</div>;
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700 pb-10">
      
      {/* BARRA HORIZONTAL DE RESERVAS (ESTILO PREMIUM) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <form onSubmit={hacerReserva} className="flex flex-col xl:flex-row items-end gap-6">
          
          {/* Buscador 5-101 */}
          <div className="flex-1 w-full space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Residente</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Ej: 5-101"
                className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:ring-4 ring-emerald-500/5 focus:border-emerald-500 font-bold text-slate-700 transition-all"
                value={residenteSeleccionado ? `${residenteSeleccionado.torre.replace("Torre ", "")}-${residenteSeleccionado.apartamento}` : searchResidente}
                onChange={(e) => { setSearchResidente(e.target.value); setResidenteSeleccionado(null); }}
              />
              {residenteSeleccionado && <button type="button" onClick={() => {setResidenteSeleccionado(null); setSearchResidente("");}} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500"><X size={16}/></button>}
            </div>

            {residentesSugeridos.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 mt-2 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                {residentesSugeridos.map(r => (
                  <button key={r.id} type="button" onClick={() => { setResidenteSeleccionado(r); setSearchResidente(""); }} className="w-full p-4 text-left hover:bg-slate-50 flex justify-between items-center transition-colors border-b border-slate-50 last:border-0">
                    <span className="font-bold text-slate-700 text-sm">{r.nombre}</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{r.torre.replace("Torre ","T")}-{r.apartamento}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selector de Zona */}
          <div className="w-full xl:w-72 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Zona</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button type="button" onClick={() => setZona("Salón Comunal")} className={`py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${zona === 'Salón Comunal' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Clock size={14}/> SALÓN
              </button>
              <button type="button" onClick={() => setZona("BBQ")} className={`py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${zona === 'BBQ' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Flame size={14}/> BBQ
              </button>
            </div>
          </div>

          {/* Jornada (Solo Salon) */}
          <div className={`w-full xl:w-48 space-y-2 transition-all duration-500 ${zona === 'Salón Comunal' ? 'opacity-100 scale-100' : 'opacity-30 grayscale pointer-events-none'}`}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Jornada</label>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button type="button" onClick={() => setJornada("Día")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${jornada === 'Día' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                <Sun size={14}/> DÍA
              </button>
              <button type="button" onClick={() => setJornada("Noche")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${jornada === 'Noche' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                <Moon size={14}/> NOCHE
              </button>
            </div>
          </div>

          {/* Fecha */}
          <div className="w-full xl:w-56 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>

          {/* Botón Acción */}
          <button 
            type="submit" 
            disabled={guardando}
            className="w-full xl:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-5 rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            {guardando ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20}/> RESERVAR</>}
          </button>
        </form>
      </div>

      {/* CALENDARIO FULL WIDTH */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Cabecera del Calendario */}
        <div className="p-8 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Control de Disponibilidad</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-100"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-100"><ChevronRight size={20}/></button>
          </div>
        </div>

        {renderDaysHeader()}
        {loading ? (
          <div className="h-[600px] flex items-center justify-center bg-white"><Loader2 className="animate-spin text-emerald-500" size={50} /></div>
        ) : (
          renderCells()
        )}

        {/* Leyenda Inferior */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-8 justify-center">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div> Salón Comunal</div>
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm"></div> Zona BBQ</div>
        </div>
      </div>
    </div>
  );
}