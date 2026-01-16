"use client";
import { 
  Building2, PieChart, Wallet, LogOut, 
  Users, MapPin, Zap, BarChart3, Settings, 
  UserCircle2, Receipt, History, ChevronRight, X 
} from "lucide-react";

// Agrupamos los ítems por categorías lógicas
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
        
        {/* HEADER: LOGO Y NOMBRE DEL CONJUNTO */}
        <div className="p-8 mb-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-lg">
                  <Building2 size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-white font-black text-xl tracking-tighter italic uppercase">
                  Admin<span className="text-emerald-500">.</span>
                </h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="md:hidden text-zinc-600"><X size={20}/></button>
            </div>
            
            {/* NOMBRE DEL CONJUNTO REFINADO */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] leading-none">
                Conjunto Residencial
              </p>
              <p className="text-white text-[11px] font-bold uppercase tracking-widest opacity-80">
                Parque de las Flores
              </p>
              <div className="h-[1px] w-full bg-gradient-to-r from-emerald-500/50 to-transparent mt-2"></div>
            </div>
          </div>
        </div>

        {/* LISTADO POR CATEGORÍAS */}
        <nav className="flex-1 px-4 space-y-6 overflow-y-auto no-scrollbar pb-10">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {/* TÍTULO DE CATEGORÍA */}
              <h3 className="px-4 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">
                {group.title}
              </h3>
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); if(window.innerWidth < 768) setIsOpen(false); }}
                      className={`
                        w-full group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300
                        ${isActive ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/10" : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"}
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
                      {isActive && <ChevronRight size={12} className="opacity-50" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* FOOTER: USUARIO */}
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
            
            <button 
              onClick={onLogout}
              className="p-2.5 text-zinc-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all active:scale-90"
            >
              <LogOut size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

      </div>
    </>
  );
}