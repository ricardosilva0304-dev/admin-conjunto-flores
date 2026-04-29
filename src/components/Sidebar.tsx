"use client";
import {
  LayoutDashboard, History, Wallet, Receipt, Zap,
  LogOut, UserCircle2, Users, MapPin, BarChart3, Settings,
  Flower2, ChevronRight, FolderOpen
} from "lucide-react";

const menuItems = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={18} /> },
  { id: 'balance', label: 'Saldos', icon: <History size={18} /> },
  { id: 'ingresos', label: 'Ingresos', icon: <Wallet size={18} /> },
  { id: 'recibos', label: 'Historial Recibos', icon: <Receipt size={18} /> },
  { id: 'causacion', label: 'Causación Mensual', icon: <Zap size={18} /> },
  { id: 'egresos', label: 'Egresos', icon: <LogOut size={18} className="rotate-180" /> },
  { id: 'deudores', label: 'Cartera & Mora', icon: <UserCircle2 size={18} /> },
  { id: 'residentes', label: 'Residentes', icon: <Users size={18} /> },
  { id: 'documentos', label: 'Documentos', icon: <FolderOpen size={18} /> },
  { id: 'zonas', label: 'Reservas Áreas', icon: <MapPin size={18} /> },
  { id: 'reportes', label: 'Reportes Mensuales', icon: <BarChart3 size={18} /> },
  { id: 'config', label: 'Configuración', icon: <Settings size={18} /> },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
  role: string; 
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout, role }: SidebarProps) {
  
  // 1. Filtrar los items aquí
  const filteredMenuItems = menuItems.filter(item => {
    if (role === 'contador') {
      return ['resumen', 'recibos', 'balance', 'deudores', 'reportes'].includes(item.id);
    }
    return true; 
  });
  
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] md:hidden transition-all" onClick={() => setIsOpen(false)}></div>
      )}

      <div className={`
        fixed md:relative inset-y-0 left-0 w-64 bg-[#09090b] flex flex-col z-[210] 
        transition-all duration-300 border-r border-white/5 shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* LOGO COMPACTO */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Flower2 className="text-black" size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-base font-black tracking-tighter italic leading-none">ADMIN</h1>
            <p className="text-zinc-600 font-bold uppercase text-[7px] tracking-[0.2em] mt-1">Parque de las Flores</p>
          </div>
        </div>

        {/* NAVEGACIÓN - AQUÍ USAMOS filteredMenuItems */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
          {filteredMenuItems.map((item) => { // <--- CAMBIO AQUÍ
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative
                  ${isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full shadow-[0_0_10px_emerald]"></div>
                )}
                <span className={`${isActive ? "text-emerald-500" : "group-hover:text-emerald-400"}`}>
                  {item.icon}
                </span>
                <span className={`text-[12px] tracking-tight ${isActive ? "font-black" : "font-semibold"}`}>
                  {item.label}
                </span>
                <ChevronRight size={10} className={`ml-auto opacity-0 group-hover:opacity-40 transition-opacity`} />
              </button>
            );
          })}
        </nav>

        {/* BOTÓN CERRAR SESIÓN */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
              <LogOut size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>
          </button>
        </div>

      </div>
    </>
  );
}