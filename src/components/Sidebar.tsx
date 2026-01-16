"use client";
import { useState, useEffect } from "react";
import {
  Building2, PieChart, Wallet, LogOut,
  Users, MapPin, Zap, BarChart3, Settings,
  UserCircle2, Receipt, History, ChevronRight, X, ChevronDown
} from "lucide-react";

const menuGroups = [
  {
    title: "Administración",
    items: [
      { id: 'resumen', label: 'Panel Global', icon: <PieChart size={16} /> },
      { id: 'balance', label: 'Balance Histórico', icon: <History size={16} /> },
    ]
  },
  {
    title: "Finanzas & Recaudo",
    items: [
      { id: 'ingresos', label: 'Caja de Ingresos', icon: <Wallet size={16} /> },
      { id: 'recibos', label: 'Historial Recibos', icon: <Receipt size={16} /> },
      { id: 'causacion', label: 'Causación Mensual', icon: <Zap size={16} /> },
    ]
  },
  {
    title: "Egresos & Cartera",
    items: [
      { id: 'egresos', label: 'Gestión Egresos', icon: <LogOut size={16} className="rotate-180" /> },
      { id: 'deudores', label: 'Cartera & Mora', icon: <UserCircle2 size={16} /> },
    ]
  },
  {
    title: "Copropiedad",
    items: [
      { id: 'residentes', label: 'Base Residentes', icon: <Users size={16} /> },
      { id: 'zonas', label: 'Reservas Áreas', icon: <MapPin size={16} /> },
    ]
  },
  {
    title: "Sistema",
    items: [
      { id: 'reportes', label: 'Reportes Mensuales', icon: <BarChart3 size={16} /> },
      { id: 'config', label: 'Configuración', icon: <Settings size={16} /> },
    ]
  }
];

export default function Sidebar({ activeTab, setActiveTab, onLogout, isOpen, setIsOpen, adminName }: any) {
  // Estado para controlar qué categoría está abierta
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Administración");

  // Efecto para abrir automáticamente la categoría si se cambia de tab desde fuera
  useEffect(() => {
    const group = menuGroups.find(g => g.items.some(i => i.id === activeTab));
    if (group) setExpandedGroup(group.title);
  }, [activeTab]);

  const toggleGroup = (title: string) => {
    setExpandedGroup(expandedGroup === title ? null : title);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] md:hidden" onClick={() => setIsOpen(false)}></div>
      )}

      <div className={`
        fixed md:relative inset-y-0 left-0 w-72 bg-[#090a0c] flex flex-col z-[210] transition-all duration-500 border-r border-white/5 shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* REEMPLAZA TODA LA SECCIÓN DEL HEADER DEL SIDEBAR POR ESTA: */}
        <div className="p-10 mb-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Logo más grande y con efecto premium */}
                <div className="relative group/logo">
                  <div className="absolute -inset-2 bg-emerald-500/20 rounded-2xl blur-xl opacity-50 group-hover/logo:opacity-100 transition duration-1000"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-zinc-800 to-black border border-white/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-2xl transition-all group-hover/logo:scale-110 group-hover/logo:border-emerald-500/50">
                    <Building2 size={28} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Texto ADMIN principal con más peso */}
                <h2 className="text-white font-black text-3xl tracking-tighter italic uppercase group-hover:text-emerald-400 transition-colors">
                  Admin<span className="text-emerald-500 not-italic">.</span>
                </h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-600 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            {/* Identidad del Conjunto: Escala mayor y tipografía estructurada */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-[1px] w-4 bg-emerald-500"></div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] leading-none">
                  Conjunto Residencial
                </p>
              </div>
              <p className="text-white text-[15px] font-black uppercase tracking-[0.1em] leading-tight">
                Parque de las <br />
                <span className="text-emerald-500/90 text-2xl tracking-tighter italic">Flores</span>
              </p>

              {/* Separador estilizado */}
              <div className="relative h-[2px] w-full bg-zinc-900 mt-4 overflow-hidden rounded-full">
                <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        {/* LISTADO CON ACORDEÓN */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar pb-10">
          {menuGroups.map((group, idx) => {
            const isExpanded = expandedGroup === group.title;
            const hasActiveItem = group.items.some(i => i.id === activeTab);

            return (
              <div key={idx} className="space-y-1">
                {/* CABECERA DE CATEGORÍA CLICKEABLE */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all
                    ${isExpanded || hasActiveItem ? "text-emerald-500 bg-white/[0.02]" : "text-zinc-600 hover:text-zinc-400"}
                  `}
                >
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {group.title}
                  </h3>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* ITEMS DESPLEGABLES CON ANIMACIÓN DE ENTRADA */}
                {isExpanded && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); if (window.innerWidth < 768) setIsOpen(false); }}
                          className={`
                            w-full group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all
                            ${isActive ? "bg-emerald-500 text-black shadow-lg" : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`${isActive ? "text-black" : "group-hover:text-emerald-400"}`}>
                              {item.icon}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "font-black" : ""}`}>
                              {item.label}
                            </span>
                          </div>
                          {isActive && <div className="w-1 h-1 bg-black rounded-full"></div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-[#050607]">
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3 flex items-center justify-between group/user">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-black text-[10px] italic shrink-0">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-white text-[10px] font-black truncate uppercase">{adminName || 'Admin Muñoz'}</p>
                <p className="text-emerald-500/40 text-[8px] font-bold tracking-widest uppercase">EN LÍNEA</p>
              </div>
            </div>
            <button onClick={onLogout} className="p-2.5 text-zinc-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all">
              <LogOut size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}