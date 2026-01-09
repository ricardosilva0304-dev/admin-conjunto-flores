"use client";
import { 
  Building2, PieChart, Wallet, Calendar, LogOut, 
  Users, Map, BarChart3, Settings, UserCircle2, 
  ChevronRight, Receipt 
} from "lucide-react";

// Lista de menús organizada
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

export default function Sidebar({ activeTab, setActiveTab, onLogout }: any) {
  return (
    <div className="w-64 h-screen bg-[#0F1115] flex flex-col border-r border-white/5 shadow-2xl relative z-50">
      
      {/* 1. LOGO Y CABECERA (Limpio y centrado en el sidebar) */}
      <div className="p-8">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-12 h-12 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-3">
              <Building2 className="text-black" size={26} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h2 className="text-white font-black text-xl tracking-tighter leading-none flex items-center">
              ADMIN<span className="text-emerald-500 ml-0.5">.</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Conjunto V1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MENÚ DE NAVEGACIÓN (Se expande para empujar el resto abajo) */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar pb-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
              activeTab === item.id 
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" 
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`${activeTab === item.id ? "text-emerald-500" : "text-zinc-600 group-hover:text-zinc-300"}`}>
                {item.icon}
              </span>
              <span className="text-xs font-bold tracking-wide uppercase">{item.label}</span>
            </div>
            {activeTab === item.id && <ChevronRight size={14} className="opacity-40" />}
          </button>
        ))}
      </nav>

      {/* 3. ÁREA DE USUARIO Y LOGOUT (Corregido: Nada se sale del borde) */}
      <div className="p-4 border-t border-white/5 bg-[#0A0C0F]">
        <div className="bg-white/5 rounded-[1.25rem] p-3 flex items-center justify-between group/user border border-white/5 transition-colors hover:bg-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-500/10 shrink-0">
              AD
            </div>
            <div className="overflow-hidden text-left min-w-0 pr-1">
              <p className="text-white text-[11px] font-black truncate leading-none uppercase tracking-tight">Administradora</p>
              <p className="text-emerald-500/60 text-[9px] font-bold uppercase tracking-widest mt-1">Conectada</p>
            </div>
          </div>
          
          {/* BOTÓN DE CIERRE DE SESIÓN REUBICADO Y ELEGANTE */}
          <button 
            onClick={onLogout}
            title="Cerrar Sesión"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-600 hover:bg-rose-500 hover:text-white transition-all shadow-inner hover:shadow-rose-500/40 active:scale-90 shrink-0 ml-1"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}