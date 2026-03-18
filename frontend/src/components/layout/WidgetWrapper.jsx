// ============================================================
// components/layout/WidgetWrapper.jsx — VERSÃO MELHORADA
// ============================================================
'use client';
import { GripVertical, X, Maximize2 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export function WidgetWrapper({ children, title, widgetId, editMode }) {
  const { dispatch } = useDashboard();
  const isKpi = widgetId?.startsWith('kpi-');

  return (
    <div
      className="h-full flex flex-col bg-white rounded-xl overflow-hidden"
      style={{
        boxShadow: editMode
          ? '0 0 0 2px #3b82f6, 0 4px 12px rgba(59,130,246,0.15)'
          : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        border: editMode ? 'none' : '1px solid #f1f5f9',
      }}
    >
      {/* Cabeçalho — visível para gráficos, aparece ao editar para KPIs */}
      {(!isKpi || editMode) && (
        <div
          className={`flex items-center justify-between px-3 py-2 border-b ${
            editMode
              ? 'drag-handle cursor-move bg-blue-50 border-blue-100'
              : 'border-gray-50 bg-white'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {editMode && (
              <GripVertical className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            )}
            <span className={`text-xs font-semibold truncate ${editMode ? 'text-blue-700' : 'text-gray-600'}`}>
              {title}
            </span>
          </div>
          {editMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_WIDGET', id: widgetId })}
                className="p-1 rounded text-blue-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remover widget"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo */}
      <div className={`flex-1 overflow-hidden min-h-0 ${isKpi ? 'p-0' : 'p-3'}`}>
        {children}
      </div>
    </div>
  );
}

export default WidgetWrapper;