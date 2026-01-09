"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Importación de Componentes de Secciones
import Sidebar from "@/components/Sidebar";
import Residentes from "@/components/Residentes";
import Configuracion from "@/components/Configuracion";
import ZonasComunes from "@/components/ZonasComunes";
import Causacion from "@/components/Causacion";
import Ingresos from "@/components/Ingresos";
import HistorialRecibos from "@/components/HistorialRecibos";
import Resumen from "@/components/Resumen";
import Reportes from "@/components/Reportes";
import Egresos from "@/components/Egresos";
import Deudores from "@/components/Deudores";

// Iconos
import {
  Lock, Fingerprint, AlertCircle, Loader2, ChevronRight,
  LayoutDashboard, Settings, Users, MapPin, Zap,
  PieChart, Wallet, LogOut, UserCircle2, BarChart3, Receipt,
  Menu // <--- IMPORTANTE PARA EL BOTÓN MÓVIL
} from "lucide-react";

export default function App() {
  // --- 1. TODOS LOS HOOKS (ESTADOS) SIEMPRE AL PRINCIPIO ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Control de menú lateral en celular
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Timer del Reloj
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. LÓGICAS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: dbError } = await supabase
        .from("perfiles_admin")
        .select("*")
        .eq("cedula", cedula)
        .eq("password", password)
        .single();

      if (dbError || !data) {
        setError("La cédula o la contraseña no coinciden.");
      } else {
        setAdminName(data.nombre);
        setIsLoggedIn(true);
      }
    } catch (err) {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminName("");
    setActiveTab("resumen");
  };

  // Mapeo para los iconos y títulos del Header
  const sectionMeta: any = {
    resumen: { label: "Resumen Financiero", icon: <PieChart size={24} strokeWidth={2.5} /> },
    ingresos: { label: "Caja de Ingresos", icon: <Wallet size={24} strokeWidth={2.5} /> },
    recibos: { label: "Historial de Recibos", icon: <Receipt size={24} strokeWidth={2.5} /> },
    causacion: { label: "Causación Mensual", icon: <Zap size={24} strokeWidth={2.5} /> },
    egresos: { label: "Gestión de Egresos", icon: <LogOut size={24} strokeWidth={2.5} /> },
    deudores: { label: "Control de Cartera", icon: <UserCircle2 size={24} strokeWidth={2.5} /> },
    residentes: { label: "Directorio de Residentes", icon: <Users size={24} strokeWidth={2.5} /> },
    zonas: { label: "Reservas de Zonas", icon: <MapPin size={24} strokeWidth={2.5} /> },
    reportes: { label: "Reportes Mensuales", icon: <BarChart3 size={24} strokeWidth={2.5} /> },
    config: { label: "Configuración", icon: <Settings size={24} strokeWidth={2.5} /> },
  };

  const currentMeta = sectionMeta[activeTab] || { label: activeTab, icon: <LayoutDashboard size={24} strokeWidth={2.5} /> };

  // --- 3. RENDER CONDICIONAL DE LOGIN ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[130px] rounded-full"></div>

        <div className="w-full max-w-[420px] z-10">
          <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-6 duration-1000">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 rotate-3 transition-all duration-500 group">
              <Fingerprint className="text-black" size={42} strokeWidth={2.5} />
            </div>
            <h1 className="text-white text-4xl font-black tracking-tighter mb-2 text-center uppercase italic">Bienvenida</h1>
            <p className="text-zinc-500 font-medium tracking-wide uppercase text-[10px]">Portal Administrativo Residencial</p>
          </div>

          <div className="bg-[#18181b]/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Cédula</label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                  <input type="number" required placeholder="Identificación" className="w-full bg-black/40 border border-white/5 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 font-medium" onChange={(e) => setCedula(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                  <input type="password" required placeholder="••••••••" className="w-full bg-black/40 border border-white/5 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 font-medium" onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-rose-500 text-center text-[11px] font-bold bg-rose-500/10 py-3 rounded-xl">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98]">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "ENTRAR AL PANEL"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // --- 4. VISTA DEL DASHBOARD ---
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      
      {/* SIDEBAR CON CONTROL MÓVIL */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        {/* HEADER RESPONSIVE ACTUALIZADO */}
        <header className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-6 md:px-10 py-4 md:py-6 flex justify-between items-center z-40">
          <div className="flex items-center gap-3 md:gap-6">
            
            {/* Botón menú solo en móviles */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-3 bg-slate-900 text-white rounded-2xl shadow-lg active:scale-90 transition-all shrink-0"
            >
              <Menu size={22} />
            </button>

            <div className="hidden sm:flex w-12 h-12 bg-white border border-slate-100 rounded-2xl items-center justify-center text-emerald-600 shadow-sm shrink-0">
              {currentMeta.icon}
            </div>
            
            <div className="min-w-0">
              <h1 className="text-slate-900 text-lg md:text-2xl font-black tracking-tighter uppercase leading-none truncate">
                {currentMeta.label}
              </h1>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1 truncate">Admin: {adminName}</p>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="text-slate-900 font-black text-xl md:text-3xl tracking-tighter tabular-nums leading-none">
              {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
            <p className="hidden md:block text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
               {currentTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        {/* CONTENEDOR DE SECCIONES */}
        <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-[calc(100vh-100px)]">
          {activeTab === "resumen" && <Resumen adminName={adminName} goToDeudores={() => setActiveTab("deudores")}/>}
          {activeTab === "ingresos" && <Ingresos />}
          {activeTab === "recibos" && <HistorialRecibos />}
          {activeTab === "causacion" && <Causacion />}
          {activeTab === "residentes" && <Residentes />}
          {activeTab === "zonas" && <ZonasComunes />}
          {activeTab === "reportes" && <Reportes />}
          {activeTab === "config" && <Configuracion />}
          {activeTab === "egresos" && <Egresos />}
          {activeTab === "deudores" && <Deudores />}
        </div>
      </main>
    </div>
  );
}