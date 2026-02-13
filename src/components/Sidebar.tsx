"use client";
import {
  LayoutDashboard, History, Wallet, Receipt, Zap,
  LogOut, UserCircle2, Users, MapPin, BarChart3, Settings,
  Flower2, ShieldCheck, ChevronRight
} from "lucide-react";

// Agrupamos los items para dar orden visual
const menuGroups = [
  {
    title: "Principal",
    items: [
      { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={18} /> },
      { id: 'balance', label: 'Balance Histórico', icon: <History size={18} /> },
    ]
  },
  {
    title: "Gestión de Caja",
    items: [
      { id: 'ingresos', label: 'Ingresos', icon: <Wallet size={18} /> },
      { id: 'recibos', label: 'Historial Recibos', icon: <Receipt size={18} /> },
      { id: 'egresos', label: 'Egresos', icon: <LogOut size={18} className="rotate-180" /> },
    ]
  },
  {
    title: "Cobranza y Cartera",
    items: [
      { id: 'causacion', label: 'Causación Mensual', icon: <Zap size={18} /> },
      { id: 'deudores', label: 'Cartera & Mora', icon: <UserCircle2 size={18} /> },
    ]
  },
  {
    title: "Administración",
    items: [
      { id: 'residentes', label: 'Residentes', icon: <Users size={18} /> },
      { id: 'zonas', label: 'Reservas Áreas', icon: <MapPin size={18} /> },
      { id: 'reportes', label: 'Reportes Mensuales', icon: <BarChart3 size={18} /> },
      { id: 'config', label: 'Configuración', icon: <Settings size={18} /> },
    ]
  }
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Backdrop para móviles con desenfoque */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] md:hidden transition-all duration-500" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Contenedor del Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 w-72 bg-[#09090b] flex flex-col z-[210] 
        transition-all duration-500 ease-in-out border-r border-white/5 shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* CABECERA: Identidad del Conjunto */}
        <div className="px-6 py-10 flex flex-col items-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 rotate-3 transition-transform hover:rotate-0 duration-300">
            <Flower2 className="text-black" size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-white text-xl font-black tracking-tighter italic">ADMIN. PRO</h1>
          <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.3em] mt-1">Parque de las Flores</p>
        </div>

        {/* NAVEGACIÓN SCROLLABLE */}
        <nav className="flex-1 px-4 pb-8 space-y-8 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              {/* Título del Grupo */}
              <h3 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                {group.title}
              </h3>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (window.innerWidth < 768) setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative
                        ${isActive 
                          ? "bg-white/[0.06] text-emerald-400 shadow-inner" 
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02]"
                        }
                      `}
                    >
                      {/* Indicador Izquierdo Glow */}
                      {isActive && (
                        <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                      )}

                      {/* Icono */}
                      <span className={`transition-transform duration-300 ${isActive ? "scale-110 text-emerald-500" : "group-hover:scale-110"}`}>
                        {item.icon}
                      </span>
                      
                      {/* Texto */}
                      <span className={`text-xs tracking-wide transition-colors ${isActive ? "font-black" : "font-semibold"}`}>
                        {item.label}
                      </span>

                      {/* Flecha Sutil a la derecha */}
                      <ChevronRight 
                        size={12} 
                        className={`ml-auto transition-all duration-300 ${isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-40"}`} 
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* PIE: Estado del Sistema / Usuario */}
        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-2xl border border-white/5">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                    <ShieldCheck size={16} className="text-emerald-500" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white leading-none">SISTEMA ACTIVO</span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase mt-1">V 2.0.4 - 2026</span>
                </div>
            </div>
        </div>

      </div>

      {/* Estilos para scrollbar invisible */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </>
  );
}