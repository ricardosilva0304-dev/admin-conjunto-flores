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
  Lock, Fingerprint, Loader2,
  LayoutDashboard, Settings, Users, MapPin, Zap,
  PieChart, Wallet, LogOut, UserCircle2, BarChart3, Receipt,
  Menu, History, Info, Calendar
} from "lucide-react";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userRole, setUserRole] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const nombre = sectionMeta[activeTab]?.label || activeTab;
    document.title = `${nombre} · Parque de las Flores`;
  }, [activeTab, isLoggedIn]);

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
        setUserRole(data.rol || "admin");
        setIsLoggedIn(true);
      }
    } catch (err) {
      setError("Error de conexión.");
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

  const sectionMeta: any = {
    resumen: { label: "Panel Principal", labelShort: "Dashboard", icon: <LayoutDashboard size={20} strokeWidth={2.5} /> },
    balance: { label: "Balance Histórico", labelShort: "Balance", icon: <History size={20} strokeWidth={2.5} /> },
    ingresos: { label: "Caja de Ingresos", labelShort: "Ingresos", icon: <Wallet size={20} strokeWidth={2.5} /> },
    recibos: { label: "Historial Recibos", labelShort: "Recibos", icon: <Receipt size={20} strokeWidth={2.5} /> },
    causacion: { label: "Causación Mensual", labelShort: "Causación", icon: <Zap size={20} strokeWidth={2.5} /> },
    egresos: { label: "Gestión de Gastos", labelShort: "Egresos", icon: <LogOut size={20} strokeWidth={2.5} /> },
    deudores: { label: "Control Cartera", labelShort: "Cartera", icon: <UserCircle2 size={20} strokeWidth={2.5} /> },
    residentes: { label: "Base Residentes", labelShort: "Residentes", icon: <Users size={20} strokeWidth={2.5} /> },
    zonas: { label: "Reservas Áreas", labelShort: "Zonas", icon: <MapPin size={20} strokeWidth={2.5} /> },
    reportes: { label: "Reporte Mensual", labelShort: "Reportes", icon: <BarChart3 size={20} strokeWidth={2.5} /> },
    config: { label: "Configuración", labelShort: "Config", icon: <Settings size={20} strokeWidth={2.5} /> },
  };

  const currentMeta = sectionMeta[activeTab] || { label: activeTab, labelShort: activeTab, icon: <Info size={20} /> };

  // ── LOGIN ──────────────────────────────────────────────────────────
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
              {error && (
                <p className="text-rose-500 text-center text-[11px] font-black bg-rose-500/10 py-4 rounded-2xl border border-rose-500/10">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-30 uppercase tracking-widest text-xs">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "Iniciar Gestión"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(t: string) => { setActiveTab(t); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
        role={userRole}
      />

      <main className="flex-1 overflow-y-auto relative scroll-smooth flex flex-col min-w-0">

        {/* ── HEADER ────────────────────────────────────────────── */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 transition-all
          px-3 py-2.5
          md:px-10 md:py-4">

          <div className="flex items-center justify-between gap-2">

            {/* IZQUIERDA: Hamburger + Sección */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">

              {/* Botón menú móvil */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden flex-shrink-0 p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
              >
                <Menu size={18} strokeWidth={2.5} />
              </button>

              {/* Icono sección — solo sm+ */}
              <div className="hidden sm:flex w-9 h-9 md:w-11 md:h-11 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl items-center justify-center shadow-sm shadow-emerald-500/10 flex-shrink-0">
                {currentMeta.icon}
              </div>

              {/* Texto */}
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-0.5 hidden sm:block">
                  Plataforma de Gestión
                </span>
                <h1 className="font-black tracking-tight leading-none text-slate-900 truncate
                  text-base
                  sm:text-lg
                  md:text-xl">
                  {/* Móvil: nombre corto / Desktop: nombre completo */}
                  <span className="sm:hidden">{currentMeta.labelShort}</span>
                  <span className="hidden sm:inline">{currentMeta.label}</span>

                  {/* Dot animado */}
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-2 align-middle" />
                </h1>
              </div>
            </div>

            {/* DERECHA: Reloj */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Hora */}
              <div className="flex items-baseline gap-1 text-slate-900">
                <span className="font-black tabular-nums tracking-tighter
                  text-lg
                  md:text-2xl">
                  {currentTime.toLocaleTimeString('es-CO', {
                    hour: '2-digit', minute: '2-digit', hour12: false
                  })}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-emerald-500 opacity-80 tabular-nums">
                  {currentTime.getSeconds().toString().padStart(2, '0')}
                </span>
              </div>

              {/* Fecha — siempre visible, formato compacto en móvil */}
              <div className="ml-1 md:ml-3 pl-2 md:pl-4 border-l border-slate-100">
                <div className="px-1.5 md:px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={9} className="text-slate-400 flex-shrink-0" />
                  {/* Móvil: día y mes abreviado. Desktop: día semana + día + mes */}
                  <span className="sm:hidden">
                    {currentTime.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">
                    {currentTime.toLocaleDateString('es-CO', {
                      weekday: 'short', day: '2-digit', month: 'short'
                    }).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* ── CONTENIDO ─────────────────────────────────────────── */}
        <div className="flex-1 p-3 sm:p-6 md:p-12 max-w-[1400px] w-full mx-auto animate-in fade-in duration-1000">

          {activeTab === "resumen" && <Resumen adminName={adminName} goToDeudores={() => setActiveTab("deudores")} />}
          {activeTab === "balance" && <BalanceHistorial />}
          {activeTab === "ingresos" && <Ingresos role={userRole} />}
          {activeTab === "recibos" && <HistorialRecibos />}
          {activeTab === "causacion" && <Causacion role={userRole} />}
          {activeTab === "egresos" && <Egresos role={userRole} />}
          {activeTab === "deudores" && <Deudores role={userRole} />}
          {activeTab === "residentes" && <Residentes role={userRole} />}
          {activeTab === "zonas" && <ZonasComunes />}
          {activeTab === "reportes" && <Reportes />}
          {activeTab === "config" && <Configuracion role={userRole} />}

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