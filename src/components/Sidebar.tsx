"use client";
import { 
  Building2, PieChart, Wallet, Calendar, LogOut, 
  Users, Map, BarChart3, Settings, UserCircle2, 
  ChevronRight, Receipt, X // Agregamos el icono X para cerrar
} from "lucide-react";

const menuItems = [
  { id: 'resumen', label: 'Resumen', icon: <PieChart size={18} /> },
  { id: 'ingresos', label: 'Ingresos', icon: <Wallet size={18} /> },
  { id: 'recibos', label: 'Historial Recibos', icon: <Receipt size={18} /> },
  { id: 'causacion', label: 'Causación', icon: <Calendar size={18} /> },
  { id: 'egresos', label: 'Egresos', icon: <LogOut size={18} /> },
  { id: 'deudores', label: 'Deudores', icon: <UserCircle2 size={18} /> },
  { id: 'residentes', label: 'Residentes', icon: <Users size={18} /> },
  { id: 'zonas', label: 'Zonas Comunes', icon: <Map size={18} /> },
  { id: 'reportes', label: 'Reportes', icon: <BarChart3 size={18} /> },
  { id: 'config', label: 'Configuración', icon: <Settings size={18} /> },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout, isOpen, setIsOpen }: any) {
  return (
    <>
      {/* OVERLAY (Fondo oscuro al abrir en celular) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* CONTENEDOR SIDEBAR */}
      <div className={`
        fixed md:relative inset-y-0 left-0 w-72 bg-[#0F1115] flex flex-col border-r border-white/5 shadow-2xl z-[60] transition-transform duration-500 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        
        {/* CABECERA SIDEBAR */}
        <div className="p-8 flex justify-between items-center">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="relative w-10 h-10 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center">
                <Building2 className="text-black" size={22} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h2 className="text-white font-black text-xl tracking-tighter leading-none">ADMIN<span className="text-emerald-500">.</span></h2>
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mt-1">V1.0 Mobile Ready</span>
            </div>
          </div>
          
          {/* BOTÓN X (Para cerrar menú en celular) */}
          <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-500 p-2">
            <X size={20} />
          </button>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar pb-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if(window.innerWidth < 768) setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-[1rem] transition-all duration-300 group ${
                activeTab === item.id 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`${activeTab === item.id ? "text-emerald-500" : "text-zinc-600 group-hover:text-zinc-300"}`}>
                  {item.icon}
                </span>
                <span className="text-xs font-black tracking-widest uppercase">{item.label}</span>
              </div>
            </button>
          ))}
        </nav>

        {/* ÁREA DE USUARIO ABAJO */}
        <div className="p-4 border-t border-white/5 bg-[#0A0C0F]">
          <div className="bg-white/5 rounded-2xl p-3 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-black text-xs">AD</div>
              <p className="text-white text-[10px] font-black uppercase truncate tracking-tighter">Administradora</p>
            </div>
            <button 
              onClick={onLogout}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-600 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}