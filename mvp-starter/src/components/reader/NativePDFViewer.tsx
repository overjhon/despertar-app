import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, ExternalLink, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { usePDFTelemetry } from '@/hooks/usePDFTelemetry';
import { createObjectUrlFromPdf } from '@/lib/pdfUtils';
import { isPWAStandalone } from '@/utils/deviceDetection';

interface NativePDFViewerProps {
  pdfUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  maxPages?: number;
  totalPages?: number;
  ebookTitle?: string;
}

type ViewerMode = 'direct' | 'blob' | 'google' | 'error';

export const NativePDFViewer = ({
  pdfUrl,
  currentPage,
  onPageChange,
  maxPages,
  totalPages,
  ebookTitle
}: NativePDFViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [viewerMode, setViewerMode] = useState<ViewerMode>('direct');
  const [currentUrl, setCurrentUrl] = useState(pdfUrl);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const watchdogRef = useRef<number>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { logPDFEvent, logFallback } = usePDFTelemetry();

  const displayTotalPages = maxPages || totalPages || 1;
  const progressPercentage = displayTotalPages > 0 ? (currentPage / displayTotalPages) * 100 : 0;
  const isPWA = isPWAStandalone();

  // Watchdog timer para detectar iframe travado
  const startWatchdog = (mode: ViewerMode) => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
    }

    watchdogRef.current = window.setTimeout(() => {
      console.warn(`⏱️ Watchdog timeout para modo: ${mode}`);
      logFallback(mode, 'timeout', 'Watchdog triggered after 8s');
      escalateToNextMode(mode);
    }, 8000);
  };

  const clearWatchdog = () => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = undefined;
    }
  };

  // Escalação automática para próximo modo
  const escalateToNextMode = async (failedMode: ViewerMode) => {
    // Verificar conectividade antes de escalar
    if (!navigator.onLine) {
      console.log('📵 Offline detectado, pausando escalação');
      setLoading(false);
      setViewerMode('error');
      return;
    }

    setLoadAttempts(prev => prev + 1);

    if (failedMode === 'direct') {
      // Tentar Blob
      console.log('🔄 Escalando para modo Blob...');
      logFallback('direct', 'blob', 'Direct iframe failed');
      
      const blobUrl = await createObjectUrlFromPdf(pdfUrl);
      if (blobUrl) {
        setCurrentUrl(blobUrl);
        setViewerMode('blob');
        setLoading(true);
        startWatchdog('blob');
        logPDFEvent('blob_fallback_ok');
      } else {
        escalateToNextMode('blob');
      }
    } else if (failedMode === 'blob') {
      // Tentar Google Viewer
      console.log('🔄 Escalando para Google Viewer...');
      logFallback('blob', 'google', 'Blob failed');
      
      const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
      setCurrentUrl(googleUrl);
      setViewerMode('google');
      setLoading(true);
      startWatchdog('google');
      logPDFEvent('google_viewer_ok');
    } else {
      // Modo erro final
      console.error('❌ Todos os modos falharam');
      logPDFEvent('google_viewer_fail');
      setViewerMode('error');
      setLoading(false);
      clearWatchdog();
    }
  };

  // Handler de sucesso no carregamento
  const handleIframeLoad = () => {
    console.log(`✅ Iframe carregado com sucesso (modo: ${viewerMode})`);
    clearWatchdog();
    setLoading(false);
    logPDFEvent('iframe_loaded', { mode: viewerMode });
  };

  // Handler de erro do iframe
  const handleIframeError = () => {
    console.error(`❌ Erro no iframe (modo: ${viewerMode})`);
    clearWatchdog();
    escalateToNextMode(viewerMode);
  };

  const handleOpenExternal = () => {
    logPDFEvent('external_open_clicked', { mode: viewerMode });
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = () => {
    logPDFEvent('download_clicked', { mode: viewerMode });
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = ebookTitle || 'ebook.pdf';
    link.click();
  };

  const handleRetry = () => {
    setLoading(true);
    setViewerMode('direct');
    setCurrentUrl(pdfUrl);
    setLoadAttempts(0);
    clearWatchdog();
    startWatchdog('direct');
  };

  // Inicialização
  useEffect(() => {
    logPDFEvent('android_pwa_detected', { isPWA, url: pdfUrl });
    startWatchdog('direct');

    return () => clearWatchdog();
  }, [pdfUrl]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < displayTotalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getStatusMessage = () => {
    if (loading) {
      switch (viewerMode) {
        case 'direct': return 'Carregando visualizador nativo...';
        case 'blob': return 'Tentando alternativa via Blob...';
        case 'google': return 'Tentando Google Viewer...';
        default: return 'Carregando PDF...';
      }
    }
    return '';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar - Mobile */}
      <div className="bg-card px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            Pág. {currentPage}/{displayTotalPages}
          </span>
          <span className="font-semibold text-primary">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-1.5" />
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden bg-muted/20 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="text-center space-y-3">
              <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>
              {loadAttempts > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tentativa {loadAttempts + 1}...
                </p>
              )}
            </div>
          </div>
        )}

        {viewerMode === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-10 p-4">
            <Card className="max-w-md w-full p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h3 className="font-semibold text-lg">Erro ao carregar PDF</h3>
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar o PDF no visualizador integrado.
              </p>
              {isPWA && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  💡 Para melhor visualização, toque no menu (⋮) e selecione "Abrir no Chrome"
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={handleRetry} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                <div className="flex gap-2">
                  <Button onClick={handleOpenExternal} variant="default" size="sm" className="flex-1">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir no Navegador
                  </Button>
                  <Button onClick={handleDownload} variant="outline" size="sm" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={currentUrl}
          className="w-full h-full border-0"
          title={ebookTitle || 'PDF Viewer'}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-top-navigation-by-user-activation"
        />
      </div>

      {/* Navigation Controls */}
      <div className="bg-card border-t border-border px-4 py-4 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="flex-1 h-12"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Anterior
          </Button>
          
          <div className="flex items-center gap-2 px-3 bg-muted rounded-lg">
            <input
              id="native-pdf-page-input"
              name="pageNumber"
              type="number"
              min={1}
              max={displayTotalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= displayTotalPages) {
                  onPageChange(page);
                }
              }}
              aria-label="Número da página atual"
              className="w-12 px-1 py-1 text-center border-0 bg-transparent text-sm font-medium"
            />
            <span className="text-xs text-muted-foreground">/ {displayTotalPages}</span>
          </div>

          <Button
            variant="default"
            size="lg"
            onClick={handleNextPage}
            disabled={currentPage >= displayTotalPages}
            className="flex-1 h-12"
          >
            Próxima
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="text-xs"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Abrir no navegador
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-xs"
          >
            <Download className="mr-1 h-3 w-3" />
            Baixar PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
