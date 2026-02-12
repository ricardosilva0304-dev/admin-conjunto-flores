"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, Loader2, Wallet, History } from "lucide-react";

interface Props {
  residente: any;
  deudas: any[];
  onClose: () => void;
}

export default function EstadoCuenta({
  residente,
  deudas,
  onClose,
}: Props) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPagos = async () => {
      const { data } = await supabase
        .from("pagos")
        .select("*")
        .eq("residente_id", residente.id)
        .order("fecha_pago", { ascending: false });

      if (data) setPagos(data);
      setLoading(false);
    };

    fetchPagos();
  }, [residente]);

  const formatPeriodo = (mesCausado: string) => {
    if (!mesCausado) return "-";
    const [year, month] = mesCausado.split("-");
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  const deudasOrdenadas = useMemo(() => {
    return [...deudas].sort((a, b) => {
      const fA = a.causaciones_globales?.mes_causado || "";
      const fB = b.causaciones_globales?.mes_causado || "";
      return fA.localeCompare(fB);
    });
  }, [deudas]);

  const calcularValorHoy = (d: any) => {
    if (!d.causaciones_globales) return d.saldo_pendiente || 0;

    const hoy = new Date();
    const dia = hoy.getDate();
    const [yC, mC] = d.causaciones_globales.mes_causado
      .split("-")
      .map(Number);

    const m1 = d.precio_m1 || d.monto_original || 0;
    const m2 = d.precio_m2 || m1;
    const m3 = d.precio_m3 || m1;

    let precio = m1;

    if (
      hoy.getFullYear() > yC ||
      (hoy.getFullYear() === yC && hoy.getMonth() + 1 > mC)
    ) {
      precio = m3;
    } else {
      if (dia > 10 && dia <= 20) precio = m2;
      else if (dia > 20) precio = m3;
    }

    return Math.max(0, precio - (m1 - (d.saldo_pendiente || 0)));
  };

  const totalPendiente = deudas.reduce(
    (acc: number, d: any) => acc + calcularValorHoy(d),
    0
  );

  /* ---------- PAGINACIÓN REAL ---------- */

  const ROWS_PER_PAGE = 18;

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const deudaPages = chunkArray(deudasOrdenadas, ROWS_PER_PAGE);
  const pagoPages = chunkArray(pagos, ROWS_PER_PAGE);

  if (loading)
    return (
      <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <>
      <style>{`
        .print-page {
          width: 816px;
          min-height: 1056px;
          margin: 20px auto;
          padding: 40px;
          background: white;
          box-shadow: 0 0 15px rgba(0,0,0,0.1);
          page-break-after: always;
        }

        @media print {
          @page {
            size: letter;
            margin: 1.5cm;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }

          /* Ocultar botones */
          .no-print {
            display: none !important;
          }

          /* Quitar overlay oscuro */
          .print-modal {
            position: static !important;
            background: white !important;
            backdrop-filter: none !important;
            overflow: visible !important;
          }

          /* Hojas */
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            page-break-after: always;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="print-modal fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex flex-col items-center p-0 md:p-6 overflow-y-auto">
        <div className="no-print w-full max-w-4xl bg-white p-4 mb-4 flex justify-between items-center rounded-xl shadow-lg border">
          <span className="text-xs font-bold uppercase text-slate-400">
            Auditoría: {residente.apartamento}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
            >
              <Printer size={14} /> IMPRIMIR
            </button>

            <button onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        {/* -------- PÁGINAS DE DEUDAS -------- */}
        {deudaPages.map((chunk, index) => (
          <div key={index} className="print-page">
            <Header residente={residente} />

            <SectionTitle icon={<Wallet size={12} />} title="Deudas Pendientes" />

            <TableDeudas
              data={chunk}
              formatPeriodo={formatPeriodo}
              calcularValorHoy={calcularValorHoy}
            />
          </div>
        ))}

        {/* -------- PÁGINAS DE PAGOS -------- */}
        {pagoPages.map((chunk, index) => (
          <div key={`pagos-${index}`} className="print-page">
            <Header residente={residente} />

            <SectionTitle icon={<History size={12} />} title="Historial de Pagos" />

            <TablePagos data={chunk} />
          </div>
        ))}
      </div>
    </>
  );
}

/* -------- COMPONENTES AUXILIARES -------- */

function Header({ residente }: any) {
  return (
    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-6">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="w-20" />
        <div>
          <h1 className="text-sm font-black uppercase">Estado de Cuenta</h1>
          <p className="text-xs text-slate-400">
            P. DE LAS FLORES - NIT 832.011.421-3
          </p>
        </div>
      </div>

      <div className="text-right">
        <h2 className="text-2xl font-black italic">
          T{residente.torre.slice(-1)}-{residente.apartamento}
        </h2>
        <p className="text-xs text-slate-400">
          Corte: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: any) {
  return (
    <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2 border-b pb-2">
      {icon} {title}
    </h3>
  );
}

function TableDeudas({ data, formatPeriodo, calcularValorHoy }: any) {
  return (
    <table className="w-full text-sm text-left">
      <thead className="border-b font-bold uppercase text-slate-400">
        <tr>
          <th className="py-2">Periodo</th>
          <th>Concepto</th>
          <th className="text-right">Valor Hoy</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d: any) => (
          <tr key={d.id}>
            <td className="py-2 font-bold">
              {formatPeriodo(d.causaciones_globales?.mes_causado)}
            </td>
            <td>{d.concepto_nombre}</td>
            <td className="text-right font-bold text-rose-600">
              ${calcularValorHoy(d).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TablePagos({ data }: any) {
  return (
    <table className="w-full text-sm text-left border">
      <thead className="bg-slate-50 border-b font-bold uppercase text-slate-400">
        <tr>
          <th className="p-2">Recibo</th>
          <th>Fecha</th>
          <th>Medio</th>
          <th className="p-2 text-right">Monto</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p: any) => (
          <tr key={p.id}>
            <td className="p-2 font-bold">RC-{p.numero_recibo}</td>
            <td>{new Date(p.fecha_pago).toLocaleDateString()}</td>
            <td>{p.metodo_pago}</td>
            <td className="p-2 text-right font-bold text-emerald-600">
              ${Number(p.monto_total).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
