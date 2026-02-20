import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, BookOpen, RefreshCw, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { usePDFTelemetry } from '@/hooks/usePDFTelemetry';

// O pdfjs gerencia seus próprios workers internamente com workerSrc definido.
// NÃO criar Worker manualmente — causa "detached ArrayBuffer" ao remontar.
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface PDFPageViewerProps {
    pdfUrl: string;
    currentPage: number;
    totalPages?: number;
    onPageChange: (page: number) => void;
    ebookTitle?: string;
    onRetry?: () => void;
    maxPages?: number;
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
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const { logPDFEvent } = usePDFTelemetry();

    const pdfOptions = useMemo(() => ({
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        enableXfa: false,
        isEvalSupported: false,
        disableFontFace: false,
        verbosity: 0,
    }), []);

    // Rolar para o topo ao trocar de página
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    // Medir largura do container para responsividade
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

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
        setRetryCount(0);
        logPDFEvent('pdf_loaded_ok', { numPages, pdfUrl });
    }, [logPDFEvent, pdfUrl]);

    const handleRetry = useCallback(() => {
        if (retryCount >= 3) {
            toast({
                title: "Erro ao carregar PDF",
                description: "Verifique sua conexão e tente novamente mais tarde.",
                variant: "destructive",
            });
            return;
        }
        setRetryCount(prev => prev + 1);
        setError(null);
        setLoading(true);
        if (onRetry) onRetry();
    }, [retryCount, onRetry]);

    const onDocumentLoadError = useCallback(async (err: Error) => {
        console.error('❌ Erro ao carregar PDF:', err.message);
        setLoading(false);
        setError(err.message || 'Erro desconhecido');
        await logPDFEvent('pdf_load_error', { error: err.message, retryCount });
    }, [retryCount, logPDFEvent]);

    const effectiveTotalPages = numPages > 0 ? numPages : (totalPages || 0);
    const displayTotalPages = maxPages || effectiveTotalPages;
    const progressPercentage = displayTotalPages > 0 ? (currentPage / displayTotalPages) * 100 : 0;

    // Largura da página: ocupa 100% do container com zoom aplicado
    // Subtrai padding (16px cada lado = 32px) para não ter overflow horizontal
    const pageWidth = containerWidth > 0 ? Math.floor((containerWidth - 32) * scale) : undefined;

    const handlePrevPage = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < displayTotalPages) onPageChange(currentPage + 1);
    };

    return (
        <div className="flex flex-col h-full bg-background">

            {/* Barra de progresso sempre visível */}
            <div className="bg-card border-b border-border px-4 py-2 flex-shrink-0">
                <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">
                        Pág. {currentPage}/{displayTotalPages}
                    </span>
                    <div className="flex items-center gap-3">
                        {/* Controles de zoom — compactos */}
                        <button
                            onClick={() => setScale(s => Math.max(s - 0.15, 0.5))}
                            disabled={scale <= 0.5}
                            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Diminuir zoom"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-medium w-10 text-center">{Math.round(scale * 100)}%</span>
                        <button
                            onClick={() => setScale(s => Math.min(s + 0.15, 2.5))}
                            disabled={scale >= 2.5}
                            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Aumentar zoom"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </button>
                        <span className="font-semibold text-primary">{Math.round(progressPercentage)}%</span>
                    </div>
                </div>
                <Progress value={progressPercentage} className="h-1.5" />
            </div>

            {/* Área de rolagem do PDF */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/30"
            >
                <div
                    ref={containerRef}
                    className="min-h-full flex items-start justify-center p-4"
                >
                    {pdfUrl && (
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            options={pdfOptions}
                            loading={
                                <div className="flex flex-col items-center justify-center py-20 space-y-4 w-full">
                                    <div className="relative">
                                        <BookOpen className="w-16 h-16 text-primary animate-pulse" />
                                        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                                    </div>
                                    <p className="font-medium text-center">Carregando página {currentPage}...</p>
                                    <p className="text-sm text-muted-foreground text-center">Aguarde um instante ✨</p>
                                </div>
                            }
                            error={
                                <div className="p-8 text-center space-y-4 max-w-sm mx-auto py-20">
                                    <p className="text-destructive font-semibold text-lg">Erro ao carregar PDF</p>
                                    <p className="text-sm text-muted-foreground">
                                        {!navigator.onLine
                                            ? 'Você está offline. Conecte-se e tente novamente.'
                                            : 'Verifique sua conexão com a internet. Se o problema persistir, tente limpar o cache.'}
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <Button onClick={handleRetry} variant="outline" size="sm" disabled={retryCount >= 3}>
                                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                            {retryCount >= 3 ? 'Limite atingido' : 'Tentar Novamente'}
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 text-xs"
                                                onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                                            >
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                Abrir no navegador
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 text-xs"
                                                onClick={() => {
                                                    const a = document.createElement('a');
                                                    a.href = pdfUrl;
                                                    a.download = ebookTitle || 'documento.pdf';
                                                    a.click();
                                                }}
                                            >
                                                <Download className="h-3 w-3 mr-1" />
                                                Baixar PDF
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            }
                        >
                            <Page
                                pageNumber={currentPage}
                                width={pageWidth}
                                renderMode="canvas"
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                loading={
                                    <div className="flex items-center justify-center py-20">
                                        <BookOpen className="w-10 h-10 text-primary animate-pulse" />
                                    </div>
                                }
                                className="shadow-xl rounded overflow-hidden max-w-full"
                            />
                        </Document>
                    )}
                </div>
            </div>

            {/* Navegação — fixa na parte inferior */}
            <div className="flex-shrink-0 bg-card border-t border-border px-4 py-3 pb-[env(safe-area-inset-bottom,12px)]">
                <div className="flex items-center gap-3 max-w-sm mx-auto">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1}
                        className="flex-1 h-12 text-base"
                    >
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        Anterior
                    </Button>

                    <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                        {currentPage} / {displayTotalPages}
                    </span>

                    <Button
                        variant="default"
                        size="lg"
                        onClick={handleNextPage}
                        disabled={currentPage >= displayTotalPages}
                        className="flex-1 h-12 text-base"
                    >
                        Próxima
                        <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
