"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// --- IMPORTACIÓN DE COMPONENTES ---
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
import BalanceHistorial from "@/components/BalanceHistorial";

// --- ICONOS ---
import {
  Lock, Fingerprint, AlertCircle, Loader2, ChevronRight,
  LayoutDashboard, Settings, Users, MapPin, Zap,
  PieChart, Wallet, LogOut, UserCircle2, BarChart3, Receipt,
  Menu, History, Info, Calendar
} from "lucide-react";

export default function App() {
  // --- 1. TODOS LOS HOOKS (ESTADOS) AL PRINCIPIO ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Control de menú lateral para celular
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Timer para el reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. LÓGICAS DE SISTEMA ---
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
      setError("Error de conexión al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("¿Estás segura de que deseas cerrar sesión?")) {
      setIsLoggedIn(false);
      setAdminName("");
      setActiveTab("resumen");
      setIsSidebarOpen(false);
    }
  };

  // Mapeo dinámico para Títulos e Iconos en el Header
  const sectionMeta: any = {
    resumen: { label: "Panel Principal", icon: <LayoutDashboard size={24} strokeWidth={2.5} /> },
    balance: { label: "Balance Histórico", icon: <History size={24} strokeWidth={2.5} /> },
    ingresos: { label: "Caja de Ingresos", icon: <Wallet size={24} strokeWidth={2.5} /> },
    recibos: { label: "Historial Recibos", icon: <Receipt size={24} strokeWidth={2.5} /> },
    causacion: { label: "Causación Mensual", icon: <Zap size={24} strokeWidth={2.5} /> },
    egresos: { label: "Gestión de Gastos", icon: <LogOut size={24} strokeWidth={2.5} /> },
    deudores: { label: "Control Cartera", icon: <UserCircle2 size={24} strokeWidth={2.5} /> },
    residentes: { label: "Base Residentes", icon: <Users size={24} strokeWidth={2.5} /> },
    zonas: { label: "Reservas Áreas", icon: <MapPin size={24} strokeWidth={2.5} /> },
    reportes: { label: "Reporte Mensual", icon: <BarChart3 size={24} strokeWidth={2.5} /> },
    config: { label: "Configuración", icon: <Settings size={24} strokeWidth={2.5} /> },
  };

  const currentMeta = sectionMeta[activeTab] || { label: activeTab, icon: <Info size={24} /> };

  // --- 3. VISTA CONDICIONAL (LOGIN DARK) ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden font-sans text-white">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[130px] rounded-full"></div>

        <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 rotate-3 transition-all hover:rotate-0 duration-500">
              <Fingerprint className="text-black" size={42} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic">ADMIN.</h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em]">Parque de las Flores</p>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Cédula</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input type="number" required placeholder="Número Identificación" className="w-full bg-black/40 border border-white/5 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all" onChange={(e) => setCedula(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Clave Acceso</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input type="password" required placeholder="••••••••" className="w-full bg-black/40 border border-white/5 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all" onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-rose-500 text-center text-[11px] font-black bg-rose-500/10 py-4 rounded-2xl border border-rose-500/10">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-30 uppercase tracking-widest text-xs">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "Iniciar Gestión"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // --- 4. VISTA DEL DASHBOARD (USER LOGGED IN) ---
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">

      {/* MENU SIDEBAR (Responsive listo) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(t: string) => { setActiveTab(t); setIsSidebarOpen(false); }}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto relative scroll-smooth flex flex-col">

        {/* HEADER SUPERIOR NIVEL PRO */}
        <header className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-4 md:px-12 py-3 md:py-6 flex justify-between items-center z-40">

          {/* LADO IZQUIERDO: MENU Y SECCIÓN */}
          <div className="flex items-center gap-2 md:gap-8">

            {/* BOTÓN HAMBURGUESA (Móvil) - Rediseñado más táctil */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-3 bg-slate-900 text-white rounded-xl shadow-lg active:scale-90 transition-all shrink-0"
            >
              <Menu size={20} strokeWidth={3} />
            </button>

            {/* ICONO SECCIÓN (Solo PC) */}
            <div className="hidden sm:flex w-12 h-12 md:w-14 md:h-14 bg-white border border-slate-100 rounded-2xl items-center justify-center text-emerald-600 shadow-sm border-b-2 border-b-emerald-100 transition-all hover:rotate-3">
              {currentMeta.icon}
            </div>

            {/* TÍTULO Y SALUDO */}
            <div className="min-w-0">
              <h1 className="text-slate-900 text-base md:text-2xl font-black tracking-tighter uppercase leading-none truncate max-w-[120px] md:max-w-none">
                {currentMeta.label}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 md:mt-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] truncate">{adminName}</p>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: RELOJ Y FECHA DINÁMICA */}
          <div className="flex flex-col items-end shrink-0 pl-4 border-l border-slate-100 md:border-none">
            <div className="text-slate-900 font-black text-lg md:text-3xl tracking-tighter tabular-nums leading-none">
              {currentTime.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </div>

            <div className="hidden md:flex items-center gap-2 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              <Calendar size={12} className="text-slate-300" />
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                {currentTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* Fecha resumida solo para Celular */}
            <p className="md:hidden text-slate-300 text-[8px] font-black uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </p>
          </div>
        </header>

        {/* ÁREA CENTRAL DINÁMICA */}
        <div className="flex-1 p-4 md:p-12 max-w-[1400px] w-full mx-auto animate-in fade-in duration-1000">

          {activeTab === "resumen" && <Resumen adminName={adminName} goToDeudores={() => setActiveTab("deudores")} />}

          {activeTab === "balance" && <BalanceHistorial />}

          {activeTab === "ingresos" && <Ingresos />}

          {activeTab === "recibos" && <HistorialRecibos />}

          {activeTab === "causacion" && <Causacion />}

          {activeTab === "egresos" && <Egresos />}

          {activeTab === "deudores" && <Deudores />}

          {activeTab === "residentes" && <Residentes />}

          {activeTab === "zonas" && <ZonasComunes />}

          {activeTab === "reportes" && <Reportes />}

          {activeTab === "config" && <Configuracion />}

          {/* Protección en caso de tabs inexistentes */}
          {!sectionMeta[activeTab] && (
            <div className="flex flex-col items-center justify-center py-40 opacity-20">
              <Loader2 className="animate-spin text-slate-500" size={60} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}