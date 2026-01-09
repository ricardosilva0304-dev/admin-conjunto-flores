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
  PieChart, Wallet, LogOut, UserCircle2, BarChart3, Receipt
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

  // Timer del Reloj (Debe estar antes de cualquier return condicional)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. LÓGICA DE LOGIN ---
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

  // Ayudante para cambiar el icono del Header según la sección
  const getHeaderIcon = () => {
    switch (activeTab) {
      case 'resumen': return <PieChart size={28} strokeWidth={2.5} />;
      case 'ingresos': return <Wallet size={28} strokeWidth={2.5} />;
      case 'causacion': return <Zap size={28} strokeWidth={2.5} />;
      case 'egresos': return <LogOut size={28} strokeWidth={2.5} />;
      case 'deudores': return <UserCircle2 size={28} strokeWidth={2.5} />;
      case 'residentes': return <Users size={28} strokeWidth={2.5} />;
      case 'zonas': return <MapPin size={28} strokeWidth={2.5} />;
      case 'reportes': return <BarChart3 size={28} strokeWidth={2.5} />;
      case 'config': return <Settings size={28} strokeWidth={2.5} />;
      case 'recibos': return <Receipt size={28} strokeWidth={2.5} />;
      default: return <LayoutDashboard size={28} strokeWidth={2.5} />;
    }
  };

  // --- 3. VISTA DE LOGIN (SI NO ESTÁ LOGUEADO) ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[130px] rounded-full"></div>

        <div className="w-full max-w-[420px] z-10">
          <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-6 duration-1000">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 rotate-3 hover:rotate-0 transition-all duration-500 group">
              <Fingerprint className="text-black group-hover:scale-110 transition-transform" size={42} strokeWidth={2.5} />
            </div>
            <h1 className="text-white text-4xl font-black tracking-tighter mb-2 text-center uppercase italic">Bienvenida</h1>
            <p className="text-zinc-500 font-medium tracking-wide uppercase text-[10px]">Portal Administrativo Residencial</p>
          </div>

          <div className="bg-[#18181b]/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-700">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Cédula</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input
                    type="number"
                    required
                    placeholder="Tu número de identificación"
                    className="w-full bg-black/40 border border-white/5 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium placeholder:text-zinc-800"
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/5 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium placeholder:text-zinc-800"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                  <AlertCircle className="text-rose-500 shrink-0" size={18} />
                  <p className="text-rose-500 text-[11px] font-bold leading-snug">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>ENTRAR AL PANEL <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          </div>
          <p className="text-center mt-12 text-zinc-700 text-[10px] font-bold uppercase tracking-[0.3em]">
            Admin Conjunto • {new Date().getFullYear()}
          </p>
        </div>
      </main>
    );
  }

  // --- 4. VISTA DEL DASHBOARD (SI ESTÁ LOGUEADO) ---
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        {/* HEADER PREMIUM */}
        <header className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-10 py-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shadow-slate-200/50 transition-transform hover:scale-105">
              {getHeaderIcon()}
            </div>
            <div>
              <h1 className="text-slate-900 text-3xl font-black tracking-tighter capitalize leading-none mb-1.5">
                {activeTab === 'config' ? 'Configuración' : activeTab === 'zonas' ? 'Zonas Comunes' : activeTab === 'recibos' ? 'Historial de Recibos' : activeTab}
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  Bienvenida, {adminName || 'Administradora'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-slate-900 font-black text-3xl tracking-tighter tabular-nums leading-none">
              {currentTime.toLocaleTimeString('es-CO', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
              })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-[1px] w-4 bg-slate-200"></div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                {currentTime.toLocaleDateString('es-CO', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </header>

        {/* CONTENEDOR DE SECCIONES DINÁMICO */}
        <div className="p-10 max-w-7xl mx-auto min-h-[calc(100vh-100px)]">
          {activeTab === "resumen" && <Resumen adminName={adminName} />}
          {activeTab === "ingresos" && <Ingresos />}
          {activeTab === "recibos" && <HistorialRecibos />}
          {activeTab === "causacion" && <Causacion />}
          {activeTab === "residentes" && <Residentes />}
          {activeTab === "zonas" && <ZonasComunes />}
          {activeTab === "reportes" && <Reportes />}
          {activeTab === "config" && <Configuracion />}
          {activeTab === "egresos" && <Egresos />}
          {activeTab === "deudores" && <Deudores />}

          {/* Placeholders para secciones no programadas aún (Egresos y Deudores) */}
          {!['resumen', 'ingresos', 'recibos', 'causacion', 'residentes', 'zonas', 'reportes', 'config', 'egresos', 'deudores'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-300 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-slate-50 rounded-full mb-8 flex items-center justify-center border border-slate-100 shadow-inner">
                {getHeaderIcon()}
              </div>
              <h2 className="text-slate-900 text-xl font-black uppercase tracking-tighter mb-2">Sección en camino</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic max-w-xs text-center leading-relaxed">
                La sección de <span className="text-emerald-500">{activeTab}</span> se está preparando para ser increíble.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}