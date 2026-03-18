// ============================================================
// components/layout/WidgetWrapper.jsx — CORRIGIDO
// ============================================================
'use client';
import { GripVertical, X } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export function WidgetWrapper({ children, title, widgetId, editMode }) {
  const { dispatch } = useDashboard();
  const isKpi = widgetId?.startsWith('kpi-');

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden"
         style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

      {/* Cabeçalho — sempre visível para gráficos, minimalista para KPIs */}
      {(!isKpi || editMode) && (
        <div
          className={`flex items-center justify-between px-3 py-2 border-b border-gray-50 ${
            editMode ? 'cursor-move drag-handle bg-gray-50/60' : ''
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {editMode && <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 drag-handle" />}
            <span className="text-xs font-semibold text-gray-600 truncate">{title}</span>
          </div>
          {editMode && (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_WIDGET', id: widgetId })}
              className="p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Drag handle invisível para KPIs no modo edição */}
      {isKpi && editMode && (
        <div className="absolute inset-0 drag-handle cursor-move z-10 rounded-xl pointer-events-none" />
      )}

      {/* Conteúdo */}
      <div className="flex-1 p-3 overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
}

export default WidgetWrapper;
