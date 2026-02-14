import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeHardRefresh } from '@/lib/swRecovery';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
  }

  handleHardRefresh = () => {
    safeHardRefresh();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                Houve um erro ao carregar o aplicativo. Tente atualizar para resolver o problema.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={this.handleHardRefresh}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar app agora
              </Button>
              
              <Button 
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Tentar recarregar
              </Button>
            </div>

            {this.state.error && (
              <details className="text-left text-xs text-muted-foreground bg-muted p-3 rounded">
                <summary className="cursor-pointer font-medium">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
