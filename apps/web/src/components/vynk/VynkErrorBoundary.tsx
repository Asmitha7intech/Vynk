import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import { VynkButton } from './VynkButton';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class VynkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Useful diagnostic logging in development
    console.error('[VYNK ErrorBoundary Caught Error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDev = Boolean((import.meta as any)?.env?.DEV);

      return (
        <div className="p-8 sm:p-12 my-6 rounded-3xl glass-card border border-rose-500/40 relative overflow-hidden text-center max-w-xl mx-auto shadow-2xl">
          {/* Neon Rose Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                {this.props.fallbackTitle || 'Encountered an Unexpected Anomaly'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                {this.props.fallbackMessage ||
                  'A component in this view encountered a runtime error. The rest of the application shell remains operational.'}
              </p>
            </div>

            {/* Development-only diagnostic preview */}
            {isDev && this.state.error && (
              <div className="text-left bg-black/60 rounded-xl p-3 border border-rose-500/20 text-[11px] font-mono text-rose-300 max-h-36 overflow-auto">
                <p className="font-bold text-rose-400">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-1 text-[10px] text-white/50 whitespace-pre-wrap">
                    {this.state.error.stack.slice(0, 300)}...
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <VynkButton
                size="sm"
                variant="primary"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={this.handleReset}
              >
                Reload Section
              </VynkButton>

              <a href="/">
                <VynkButton
                  size="sm"
                  variant="outline"
                  leftIcon={<Home className="w-3.5 h-3.5" />}
                >
                  Return to Campus Feed
                </VynkButton>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VynkErrorBoundary;
