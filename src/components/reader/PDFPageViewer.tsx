import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// Importar o worker como asset local via bundler para produção/dev
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, BookOpen, RefreshCw, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { isAndroid, isPWAStandalone, getDeviceInfo } from '@/utils/deviceDetection';
import { NativePDFViewer } from './NativePDFViewer';
import { usePDFTelemetry } from '@/hooks/usePDFTelemetry';

// Configurar worker do PDF.js usando asset local gerado pelo bundler (Vite)
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
// Criar explicitamente o módulo Worker e fornecê-lo ao PDF.js para evitar
// quedas no fake worker em ambientes com restrições de MIME/CSP.
try {
  const moduleWorker = new Worker(workerSrc, { type: 'module' });
  // Fornece a instância do worker diretamente ao PDF.js
  // evitando que ele tente importar dinamicamente.
  // Mantemos uma única instância global para o viewer.
  // @ts-ignore - workerPort existe no runtime do pdfjs
  pdfjs.GlobalWorkerOptions.workerPort = moduleWorker as unknown as Worker;
} catch (e) {
  // Se não for possível criar o módulo Worker, o PDF.js tentará o fake worker.
  // Continuamos com workerSrc definido para permitir fallback padrão.
  console.warn('Falha ao criar módulo Worker para PDF.js, usando fallback padrão:', e);
}

interface PDFPageViewerProps {
  pdfUrl: string;
  currentPage: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  ebookTitle?: string;
  onRetry?: () => void;
  maxPages?: number; // Limite máximo de páginas (para amostras)
}

export const PDFPageViewer = ({
  pdfUrl,
  currentPage,
  totalPages,
  onPageChange,
  ebookTitle,
  onRetry,
  maxPages,
}: PDFPageViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(isAndroid() ? 0.95 : 1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [useNativeFallback, setUseNativeFallback] = useState(false);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const watchdogRef = useRef<number>();
  const { logPDFEvent, logFallback } = usePDFTelemetry();

  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    enableXfa: isAndroid() ? false : true,
    isEvalSupported: false,
    disableFontFace: isAndroid() ? true : false,
    verbosity: 1,
  }), []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('✅ PDF carregado com sucesso:', numPages, 'páginas');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    setRetryCount(0);
  }, []);

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      console.log(`🔄 Tentativa ${retryCount + 1} de recarregar PDF...`);
      setRetryCount(prev => prev + 1);
      setError(null);
      setLoading(true);
      
      if (onRetry) {
        onRetry();
      }
    } else {
      toast({
        title: "Erro ao carregar PDF",
        description: "Muitas tentativas falharam. Por favor, verifique sua conexão e tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  }, [retryCount, onRetry]);

  const onDocumentLoadError = useCallback(async (error: Error) => {
    console.error('❌ Erro ao carregar PDF:', error);
    console.error('📊 Detalhes do erro:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      pdfUrl,
      retryCount,
      online: navigator.onLine,
      isPWA: window.matchMedia('(display-mode: standalone)').matches
    });
    setLoading(false);
    
    // Verificar se está offline
    if (!navigator.onLine) {
      setError('Você está offline. Conecte-se à internet para visualizar o PDF.');
      await logPDFEvent('iframe_timeout', {
        error: error.message,
        retryCount,
        online: false,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
      });
      return;
    }
    
    await logPDFEvent('iframe_timeout', {
      error: error.message,
      retryCount,
      online: true,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    });

    // Retry com backoff exponencial antes de fallback no Android
    if (isAndroid() && retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s
      console.log(`🔄 Retry ${retryCount + 1}/2 em ${delay/1000}s...`);
      setTimeout(handleRetry, delay);
      return;
    }
    
    // Após 2 retries, fallback para Native apenas no Android
    if (isAndroid() && !useNativeFallback) {
      console.log('🔄 Acionando fallback nativo após retries...');
      await logFallback('react-pdf', 'native', error.message);
      setUseNativeFallback(true);
    } else {
      setError(`Erro ao carregar PDF: ${error.message || 'Erro desconhecido'}`);
    }
  }, [retryCount, handleRetry, logPDFEvent, logFallback, useNativeFallback, pdfUrl]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const maxAllowedPage = maxPages || effectiveTotalPages;
    if (currentPage < maxAllowedPage) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  // Prefetch removido - Online First strategy usa URL direta
  // Android: realizar preload via ArrayBuffer para evitar bloqueios de rede/worker
  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const doPreload = async () => {
      if (!pdfUrl || !isAndroid() || pdfData) return;
      try {
        setLoading(true);
        const resp = await Promise.race([
          fetch(pdfUrl, { mode: 'cors', cache: 'reload', signal: controller.signal }),
          new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
        ]);
        if (!resp || !resp.ok) throw new Error(`HTTP ${resp?.status}`);
        const buf = await resp.arrayBuffer();
        if (!aborted) {
          setPdfData(buf);
          await logPDFEvent('android_prefetch_ok', { size: buf.byteLength });
        }
      } catch (err: any) {
        console.warn('⚠️ Preload Android falhou, usando URL direta:', err?.message || err);
        await logPDFEvent('android_prefetch_fail', { error: err?.message || String(err) });
      }
    };
    doPreload();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [pdfUrl, pdfData, logPDFEvent]);

  // Android: watchdog para quedas sem erro explícito
  useEffect(() => {
    if (!isAndroid()) return;
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = undefined;
    }
    if (loading && !useNativeFallback) {
      watchdogRef.current = window.setTimeout(async () => {
        console.warn('⏱️ Watchdog Android acionado, alternando para viewer nativo');
        await logFallback('react-pdf', 'native', 'android_watchdog_timeout');
        setUseNativeFallback(true);
      }, 12000); // 12s
    }
    return () => {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = undefined;
      }
    };
  }, [loading, useNativeFallback, logFallback]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveTotalPages = numPages > 0 ? numPages : (totalPages || 0);
  const displayTotalPages = maxPages || effectiveTotalPages;
  const progressPercentage = displayTotalPages > 0 ? (currentPage / displayTotalPages) * 100 : 0;

  if (useNativeFallback) {
    return (
      <NativePDFViewer
        pdfUrl={pdfUrl}
        currentPage={currentPage}
        onPageChange={onPageChange}
        maxPages={maxPages}
        totalPages={effectiveTotalPages}
        ebookTitle={ebookTitle}
      />
    );
  }
  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Toolbar */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="h-9 w-9"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 2.5}
            className="h-9 w-9"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline">
            Página {currentPage} de {displayTotalPages}
          </span>
          
          {/* Botões de fallback - Android PWA */}
          {isAndroid() && isPWAStandalone() && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logPDFEvent('external_open_clicked', { pdfUrl });
                  window.open(pdfUrl, '_blank');
                }}
                className="hidden sm:flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir no navegador
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logPDFEvent('download_clicked', { pdfUrl });
                  const a = document.createElement('a');
                  a.href = pdfUrl;
                  a.download = ebookTitle || 'documento.pdf';
                  a.click();
                }}
                className="hidden sm:flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-9 w-9"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar - Mobile */}
      <div className="md:hidden bg-card px-4 py-2 border-b border-border">
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
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-2 md:p-4">
        {pdfUrl && (
          <Card className="shadow-xl overflow-hidden max-w-full">
            <Document
            file={isAndroid() && pdfData ? { data: pdfData } : pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            options={pdfOptions}
            loading={
              <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="relative">
                  <BookOpen className="w-16 h-16 text-primary animate-pulse" />
                  <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="font-medium">Preparando páginas com nitidez máxima...</p>
                  <p className="text-sm text-muted-foreground">Isso leva só um instante ✨</p>
                </div>
              </div>
            }
            error={
              <div className="p-8 text-center space-y-4">
                <p className="text-destructive font-semibold mb-2">
                  {error || 'Erro ao carregar PDF'}
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {retryCount > 0 
                    ? `Tentativa ${retryCount} de 3. Tentando novamente...`
                    : 'Verifique sua conexão com a internet. Se o problema persistir, tente limpar o cache.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={handleRetry} variant="outline" size="sm" disabled={retryCount >= 3}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${retryCount < 3 && loading ? 'animate-spin' : ''}`} />
                    {retryCount >= 3 ? 'Limite de tentativas atingido' : 'Tentar Novamente'}
                  </Button>
                  {retryCount >= 2 && (
                    <Button 
                      onClick={async () => {
                        console.log('🗑️ Limpando cache do PWA...');
                        if ('caches' in window) {
                          const cacheNames = await caches.keys();
                          await Promise.all(
                            cacheNames.map(name => caches.delete(name))
                          );
                          console.log('✅ Cache limpo!');
                        }
                        window.location.reload();
                      }} 
                      variant="default"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Limpar Cache
                    </Button>
                  )}
                </div>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              width={containerWidth ? Math.floor(containerWidth * scale) : undefined}
              renderMode="canvas"
              loading={
                <div className="flex items-center justify-center min-h-[600px]">
                  <div className="space-y-4 text-center">
                    <BookOpen className="w-12 h-12 text-primary animate-pulse mx-auto" />
                    <p className="text-sm text-muted-foreground">Renderizando a página {currentPage} com qualidade máxima...</p>
                  </div>
                </div>
              }
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="max-w-full"
            />
          </Document>
        </Card>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="bg-card border-t border-border px-4 py-4 md:py-3 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-center gap-3 md:gap-4 max-w-md mx-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="flex-1 md:flex-initial h-12 md:h-10"
          >
            <ChevronLeft className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Anterior</span>
          </Button>
          
          <div className="hidden md:flex items-center gap-2 px-4">
            <input
              id="pdf-page-input"
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
              className="w-16 px-2 py-1 text-center border border-border rounded bg-background"
            />
            <span className="text-sm text-muted-foreground">/ {displayTotalPages}</span>
          </div>

          <Button
            variant="default"
            size="lg"
            onClick={handleNextPage}
            disabled={currentPage >= displayTotalPages}
            className="flex-1 md:flex-initial h-12 md:h-10"
          >
            <span className="hidden md:inline">Próxima</span>
            <ChevronRight className="h-5 w-5 md:ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};