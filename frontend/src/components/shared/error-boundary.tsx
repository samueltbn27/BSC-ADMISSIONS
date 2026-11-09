import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-card">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
            <h1 className="mt-4 text-lg font-semibold text-slate-900">Terjadi kesalahan aplikasi</h1>
            <p className="mt-2 text-sm text-slate-500">
              Coba muat ulang halaman. Jika tetap terjadi, hubungi pengembang.
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Muat Ulang
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
