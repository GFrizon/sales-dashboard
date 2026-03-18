// ============================================================
// components/ui/ExportButton.jsx — VERSÃO CORRIGIDA
// Correção:
//   API_BASE usa '/api' (proxy do Next.js) em vez do backend direto
//   Antes: 'http://localhost:4000/api' → causava CORS em produção
//   Agora:  '/api'                     → usa o proxy configurado em next.config.js
// ============================================================
'use client';
import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, Printer, ChevronDown, Loader2 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

// CORREÇÃO: usar proxy do Next.js, não o backend diretamente
const API_BASE = '/api';

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('dashboard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function ExportButton() {
  const { filterParams } = useDashboard();
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleExcel() {
    setLoading(true);
    setOpen(false);
    try {
      const params = filterParams();
      const qs     = params ? `?${params}` : '';

      // Busca todos os dados em paralelo, com os filtros ativos
      const headers = { ...getAuthHeaders() };
      const [kpisR, vendR, cliR, prodR] = await Promise.all([
        fetch(`${API_BASE}/sales/kpis${qs}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/sales/ranking/vendedores${qs}&limit=50`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/sales/ranking/clientes${qs}&limit=50`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/sales/ranking/produtos${qs}&limit=50`, { headers }).then(r => r.json()),
      ]);

      const { exportToExcel } = await import('../../utils/export');
      await exportToExcel({
        kpis:       kpisR,
        vendedores: Array.isArray(vendR) ? vendR : [],
        clientes:   Array.isArray(cliR)  ? cliR  : [],
        produtos:   Array.isArray(prodR) ? prodR : [],
      });
    } catch (err) {
      console.error('[ExportButton] erro ao exportar:', err);
      alert('Erro ao exportar: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    setOpen(false);
    window.print();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Download className="w-3.5 h-3.5" />
        }
        {loading ? 'Gerando...' : 'Exportar'}
        {!loading && <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-48 py-1 overflow-hidden">
          <button
            onClick={handleExcel}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Excel (.xlsx)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Imprimir / PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
