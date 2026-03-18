// ============================================================
// app/layout.jsx — Root layout (Next.js App Router)
// ============================================================
import '../styles/globals.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DashboardProvider } from '../context/DashboardContext';
import { AuthProvider } from '../context/AuthContext';
import { AuthGuard } from '../components/auth/AuthGuard';

export const metadata = {
  title: 'Dashboard de Vendas',
  description: 'Análise executiva de vendas em tempo real',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 antialiased" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <AuthProvider>
          <DashboardProvider>
            <AuthGuard>{children}</AuthGuard>
          </DashboardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
