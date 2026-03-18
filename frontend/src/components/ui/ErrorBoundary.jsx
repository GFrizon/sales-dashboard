// ============================================================
// components/ui/ErrorBoundary.jsx
// Captura erros de render e exibe mensagem amigável
// ============================================================
'use client';
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Widget error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-4">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <p className="text-xs font-medium text-gray-500">Erro ao carregar widget</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
