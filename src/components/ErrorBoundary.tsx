import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, LogIn, Music } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SITDOWORLD AI MUSIC] ErrorBoundary intercepted error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleGoLogin = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/auth';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 text-center space-y-6 animate-in fade-in">
            {/* Brand Logo Header */}
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#FF7A00] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-lg tracking-tight text-[#0F172A] block leading-none">
                  SITDOWORLD <span className="text-[#FF7A00]">AI MUSIC</span>
                </span>
                <span className="text-[11px] font-medium text-[#64748B]">
                  Système de Continuité de Service
                </span>
              </div>
            </div>

            {/* Error Icon Badge */}
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* User Friendly Message */}
            <div className="space-y-2">
              <h2 className="text-xl font-black text-[#0F172A]">
                Une interruption temporaire est survenue
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Le studio a sécurisé votre session. Vous pouvez relancer le moteur ou retourner à la page d'accueil immédiatement sans perte de vos données.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réessayer immédiatement</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={this.handleGoLogin}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Se connecter</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Recharger page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
