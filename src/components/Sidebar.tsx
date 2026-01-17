"use client";
import { useState, useEffect } from "react";
import {
  Building2, PieChart, Wallet, LogOut,
  Users, MapPin, Zap, BarChart3, Settings,
  UserCircle2, Receipt, History, ChevronRight, X, ChevronDown,
  LayoutDashboard, ShieldCheck
} from "lucide-react";

const menuGroups = [
  {
    title: "Administración",
    items: [
      { id: 'resumen', label: 'Panel Global', icon: <LayoutDashboard size={18} /> },
      { id: 'balance', label: 'Balance Histórico', icon: <History size={18} /> },
    ]
  },
  {
    title: "Finanzas & Recaudo",
    items: [
      { id: 'ingresos', label: 'Caja de Ingresos', icon: <Wallet size={18} /> },
      { id: 'recibos', label: 'Historial Recibos', icon: <Receipt size={18} /> },
      { id: 'causacion', label: 'Causación Mensual', icon: <Zap size={18} /> },
    ]
  },
  {
    title: "Egresos & Cartera",
    items: [
      { id: 'egresos', label: 'Gestión Egresos', icon: <LogOut size={18} className="rotate-180" /> },
      { id: 'deudores', label: 'Cartera & Mora', icon: <UserCircle2 size={18} /> },
    ]
  },
  {
    title: "Copropiedad",
    items: [
      { id: 'residentes', label: 'Base Residentes', icon: <Users size={18} /> },
      { id: 'zonas', label: 'Reservas Áreas', icon: <MapPin size={18} /> },
    ]
  },
  {
    title: "Sistema",
    items: [
      { id: 'reportes', label: 'Reportes Mensuales', icon: <BarChart3 size={18} /> },
      { id: 'config', label: 'Configuración', icon: <Settings size={18} /> },
    ]
  }
];

export default function Sidebar({ activeTab, setActiveTab, onLogout, isOpen, setIsOpen, adminName }: any) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Administración");

  // Abrir el grupo automáticamente si el tab activo pertenece a él
  useEffect(() => {
    const group = menuGroups.find(g => g.items.some(i => i.id === activeTab));
    if (group) setExpandedGroup(group.title);
  }, [activeTab]);

  return (
    <>
      {/* Backdrop para móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] md:hidden transition-opacity duration-300" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div className={`
        fixed md:relative inset-y-0 left-0 w-72 bg-[#0c0d0f] flex flex-col z-[210] 
        transition-all duration-500 ease-in-out border-r border-white/5 shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* Header con Branding */}
        <div className="p-8">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
              <Building2 size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-white font-black text-sm tracking-tighter leading-none">
                ADMIN<span className="text-emerald-500">PRO</span>
              </h2>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">
                Flores del Parque
              </p>
            </div>
          </div>
        </div>

        {/* Navegación con Acordeón */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pb-10">
          {menuGroups.map((group, idx) => {
            const isExpanded = expandedGroup === group.title;
            const hasActiveItem = group.items.some(i => i.id === activeTab);

            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.title)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300
                    ${isExpanded || hasActiveItem ? "text-white bg-white/[0.03]" : "text-zinc-500 hover:text-zinc-300"}
                  `}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                    {group.title}
                  </span>
                  <ChevronRight 
                    size={14} 
                    className={`transition-transform duration-300 ${isExpanded ? "rotate-90 text-emerald-500" : "opacity-40"}`} 
                  />
                </button>

                <div className={`
                  space-y-1 overflow-hidden transition-all duration-500 ease-in-out
                  ${isExpanded ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"}
                `}>
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
                          w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 group
                          ${isActive 
                            ? "bg-emerald-500 text-black shadow-[0_10px_20px_rgba(16,185,129,0.2)]" 
                            : "text-zinc-500 hover:text-white hover:bg-white/[0.02]"
                          }
                        `}
                      >
                        <span className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                          {item.icon}
                        </span>
                        <span className={`text-xs font-bold tracking-tight ${isActive ? "font-black" : ""}`}>
                          {item.label}
                        </span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer: Perfil de Usuario */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-black font-black text-xs">
                  {adminName?.substring(0, 2).toUpperCase() || "AD"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0c0d0f] rounded-full"></div>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-black truncate">{adminName || 'Administrador'}</p>
                <div className="flex items-center gap-1">
                  <ShieldCheck size={10} className="text-emerald-500" />
                  <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Master Admin</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all duration-300"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.2);
        }
      `}</style>
    </>
  );
}