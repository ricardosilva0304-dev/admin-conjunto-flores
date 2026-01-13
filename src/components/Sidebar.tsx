"use client";
import { 
  Building2, PieChart, Wallet, Calendar, LogOut, 
  Users, MapPin, Zap, BarChart3, Settings, 
  UserCircle2, Receipt, History, ChevronRight, X 
} from "lucide-react";

const menuItems = [
  { id: 'resumen', label: 'Panel Global', icon: <PieChart size={18} /> },
  { id: 'balance', label: 'Balance Histórico', icon: <History size={18} /> },
  { id: 'ingresos', label: 'Caja de Ingresos', icon: <Wallet size={18} /> },
  { id: 'recibos', label: 'Historial Recibos', icon: <Receipt size={18} /> },
  { id: 'causacion', label: 'Causación Mensual', icon: <Zap size={18} /> },
  { id: 'egresos', label: 'Gestión Egresos', icon: <LogOut size={18} /> },
  { id: 'deudores', label: 'Cartera & Mora', icon: <UserCircle2 size={18} /> },
  { id: 'residentes', label: 'Base Residentes', icon: <Users size={18} /> },
  { id: 'zonas', label: 'Reservas Áreas', icon: <MapPin size={18} /> },
  { id: 'reportes', label: 'Reportes Mensuales', icon: <BarChart3 size={18} /> },
  { id: 'config', label: 'Configuración', icon: <Settings size={18} /> },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout, isOpen, setIsOpen }: any) {
  return (
    <>
      {/* MÁSCARA FONDO MÓVIL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] md:hidden" onClick={() => setIsOpen(false)}></div>
      )}

      {/* CONTENEDOR SIDEBAR */}
      <div className={`
        fixed md:relative inset-y-0 left-0 w-72 bg-[#090a0c] flex flex-col z-[210] transition-all duration-500 border-r border-white/5 shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        
        {/* HEADER: LOGO CORPORATIVO */}
        <div className="p-8 mb-4">
          <div className="flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-4">
              <div className="relative">
                {/* Glow del logo */}
                <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative w-12 h-12 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-emerald-500/50">
                  <Building2 className="text-emerald-500" size={24} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-white font-black text-2xl tracking-tighter leading-none italic uppercase">
                  Admin<span className="text-emerald-500">.</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                   <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">EDICIÓN PRO</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-600 hover:text-white"><X size={20}/></button>
          </div>
        </div>

        {/* LISTADO ÚNICO DE MENÚS (REFINADO) */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar pb-10">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); if(window.innerWidth < 768) setIsOpen(false); }}
                className={`
                  w-full group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden
                  ${isActive ? "bg-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.15)]" : "hover:bg-white/[0.03] text-zinc-500 hover:text-white"}
                `}
              >
                {/* Brillo interno activo */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                )}

                <div className="flex items-center gap-4 relative z-10">
                  <span className={`
                    transition-all duration-300
                    ${isActive ? "text-black scale-110" : "group-hover:text-emerald-400 group-hover:scale-110"}
                  `}>
                    {item.icon}
                  </span>
                  <span className={`
                    text-[11px] font-bold uppercase tracking-widest transition-all
                    ${isActive ? "text-black font-black" : ""}
                  `}>
                    {item.label}
                  </span>
                </div>

                {/* Flecha solo en el activo para elegancia */}
                {isActive && (
                   <ChevronRight size={14} className="text-black/30" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ÁREA DE USUARIO: TERMINAL PREMIUM */}
        <div className="p-4 border-t border-white/5 bg-[#050607]">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-4 flex items-center justify-between shadow-2xl transition-all hover:border-emerald-500/20 group/user">
            <div className="flex items-center gap-4 min-w-0">
               <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-black font-black italic shadow-lg">
                    AD
                  </div>
               </div>
               <div className="min-w-0">
                  <p className="text-white text-[11px] font-black truncate leading-none uppercase">Admin Muñoz</p>
                  <p className="text-emerald-500/50 text-[9px] font-bold mt-1 tracking-widest uppercase">CONECTADA</p>
               </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="p-3 bg-zinc-800 text-zinc-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-md group-hover/user:bg-zinc-800"
            >
              <LogOut size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

      </div>
    </>
  );
}