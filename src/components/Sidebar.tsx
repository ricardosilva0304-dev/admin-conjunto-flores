"use client";
import {
  LayoutDashboard, History, Wallet, Receipt, Zap,
  LogOut, UserCircle2, Users, MapPin, BarChart3, Settings
} from "lucide-react";

// Lista plana de las 11 secciones
const menuItems = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={20} /> },
  { id: 'balance', label: 'Balance Histórico', icon: <History size={20} /> },
  { id: 'ingresos', label: 'Ingresos', icon: <Wallet size={20} /> },
  { id: 'recibos', label: 'Historial Recibos', icon: <Receipt size={20} /> },
  { id: 'causacion', label: 'Causación Mensual', icon: <Zap size={20} /> },
  { id: 'egresos', label: 'Egresos', icon: <LogOut size={20} className="rotate-180" /> },
  { id: 'deudores', label: 'Cartera & Mora', icon: <UserCircle2 size={20} /> },
  { id: 'residentes', label: 'Residentes', icon: <Users size={20} /> },
  { id: 'zonas', label: 'Reservas Áreas', icon: <MapPin size={20} /> },
  { id: 'reportes', label: 'Reportes Mensuales', icon: <BarChart3 size={20} /> },
  { id: 'config', label: 'Configuración', icon: <Settings size={20} /> },
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
      {/* Backdrop para móviles (fondo oscuro al abrir menú) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] md:hidden transition-opacity duration-300" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Contenedor del Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 w-64 bg-[#0c0d0f] flex flex-col z-[210] 
        transition-transform duration-300 ease-in-out border-r border-white/5 shadow-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* Lista de Navegación (Con padding superior para separar del borde) */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) setIsOpen(false); // Cerrar en móvil al clickear
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-900/20" 
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }
                `}
              >
                {/* Icono */}
                <span className={`transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-110"}`}>
                  {item.icon}
                </span>
                
                {/* Texto */}
                <span className={`text-sm tracking-wide ${isActive ? "font-black" : "font-medium"}`}>
                  {item.label}
                </span>

                {/* Indicador de Activo (Punto derecho) */}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* Estilos para scrollbar invisible pero funcional */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>
    </>
  );
}