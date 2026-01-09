"use client";
import {
  Building2, PieChart, Wallet, Calendar, LogOut,
  Users, Map, BarChart3, Settings, UserCircle2, ChevronRight, Receipt
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

export default function Sidebar({ activeTab, setActiveTab }: any) {
  return (
    <div className="w-64 h-screen bg-[#0F1115] flex flex-col border-r border-white/5 shadow-2xl z-20">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-4 group cursor-default">
          {/* Contenedor del Icono con efecto de Brillo */}
          <div className="relative">
            {/* Brillo de fondo (Glow) */}
            <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur opacity-25 group-hover:opacity-60 transition duration-1000"></div>

            {/* Cuadrado del Logo */}
            <div className="relative w-12 h-12 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
              <Building2 className="text-black" size={26} strokeWidth={2.5} />
            </div>
          </div>

          {/* Texto de Identidad */}
          <div className="flex flex-col justify-center">
            <h2 className="text-white font-black text-2xl tracking-tighter leading-none flex items-center">
              ADMIN<span className="text-emerald-500 ml-0.5">.</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap">
                Conjunto <span className="text-zinc-700 font-bold ml-1">v1.0</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === item.id
                ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={`${activeTab === item.id ? "text-emerald-500" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
            </div>
            {activeTab === item.id && <ChevronRight size={14} className="opacity-50" />}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">AD</div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-bold truncate">Administradora</p>
            <p className="text-zinc-500 text-[10px] truncate">Sesión Activa</p>
          </div>
        </div>
      </div>
    </div>
  );
}