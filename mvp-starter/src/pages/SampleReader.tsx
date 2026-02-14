import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Lock, ShoppingCart } from 'lucide-react';
import { PDFPageViewer } from '@/components/reader/PDFPageViewer';
import { trackInitiateCheckout } from '@/lib/facebookPixel';
import { getPublicPdfUrl, validatePdfUrl } from '@/lib/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { validateUUIDParam } from '@/lib/validation';

const SampleReader = () => {
  const { id: rawId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const debugMode = new URLSearchParams(window.location.search).get('debug') === '1';
  
  // Validar UUID antes de usar
  const id = validateUUIDParam(rawId, 'ebook_id');
  const [ebook, setEbook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sampleMaxPage, setSampleMaxPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Fallback local por ID (modo depuração)
  const getLocalPdfById = (ebookId: string | null): string | null => {
    switch (ebookId) {
      case '3fa85f64-5717-4562-b3fc-2c963f66afa6':
        return '/ebooks/3fa85f64-5717-4562-b3fc-2c963f66afa6/Velas-Terapeuticas-A-Linha-Funcional-Que-Fatura-3x-Mais.pdf';
      case '6ba7b810-9dad-11d1-80b4-00c04fd430c8':
        return '/ebooks/6ba7b810-9dad-11d1-80b4-00c04fd430c8/Velas_Sazonais_compressed.pdf';
      case '7c9e6679-7425-40de-944b-e07fc1f90ae7':
        return '/ebooks/7c9e6679-7425-40de-944b-e07fc1f90ae7/Velas-que-Vendem.pdf';
      case 'f47ac10b-58cc-4372-a567-0e02b2c3d479':
        return '/ebooks/f47ac10b-58cc-4372-a567-0e02b2c3d479/50-Receitas-Exclusivas-de-Velas-Gourmet.pdf';
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!user) {
      if (debugMode) {
        console.warn('🧪 Debug: sem usuário autenticado, seguindo sem redirecionar');
      } else {
        navigate('/login');
        return;
      }
    }
    
    if (!id) {
      console.error('❌ ID de ebook inválido na URL');
      toast({
        title: "Link inválido",
        description: "O link do ebook está incorreto.",
        variant: "destructive",
      });
      if (debugMode) {
        // Em debug, tentar fallback local por ID se disponível
        const local = getLocalPdfById(null);
        if (local) {
          setEbook({ id: 'local-debug', title: 'Amostra Local (Debug)', total_pages: 200, purchase_url: null });
          setPdfUrl(local);
          setLoading(false);
          return;
        }
      }
      navigate('/library');
      return;
    }
    
    fetchEbook();
  }, [user, id, navigate]);

  const fetchEbook = async () => {
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('❌ Ebook não encontrado:', id, error);
        if (debugMode) {
          console.warn('🧪 Debug: usando fallback local por ID');
          const local = getLocalPdfById(id);
          if (local) {
            setEbook({ id, title: 'Amostra Local (Debug)', total_pages: 200, purchase_url: null });
            const isValid = await validatePdfUrl(local);
            if (isValid) {
              setPdfUrl(local);
              setLoading(false);
              return;
            }
          }
        }
        toast({
          title: "Ebook não encontrado",
          description: "Este ebook não existe ou foi removido.",
          variant: "destructive",
        });
        navigate('/library');
        return;
      }
      
      setEbook(data);
      
      // Calcular 20% do total de páginas
      const maxPage = Math.ceil(data.total_pages * 0.2);
      setSampleMaxPage(maxPage);

      // Gerar URL pública para o PDF
      if (data?.sample_pdf_url || data?.pdf_url) {
        const pdfPath = data.sample_pdf_url || data.pdf_url;
        const publicUrl = getPublicPdfUrl(pdfPath);
        
        console.log('🔓 Usando URL pública para sample:', publicUrl);
        
        // Validar URL antes de usar
        const isValid = await validatePdfUrl(publicUrl);
        
        if (isValid) {
          setPdfUrl(publicUrl);
          console.log('✅ URL do PDF sample obtida');
        } else {
          console.warn('⚠️ URL de PDF inválida, tentando fallback');
          // Tentar original primeiro
          const originalValid = await validatePdfUrl(pdfPath);
          if (originalValid) {
            setPdfUrl(pdfPath);
          } else if (debugMode) {
            // Em debug, usar fallback local por ID
            const local = getLocalPdfById(id);
            if (local) {
              const localValid = await validatePdfUrl(local);
              if (localValid) {
                console.log('✅ Fallback local (debug) válido');
                setPdfUrl(local);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching ebook:', error);
      if (debugMode) {
        const local = getLocalPdfById(id);
        if (local) {
          setEbook({ id, title: 'Amostra Local (Debug)', total_pages: 200, purchase_url: null });
          const isValid = await validatePdfUrl(local);
          if (isValid) {
            setPdfUrl(local);
            setLoading(false);
            return;
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!ebook?.purchase_url) {
      toast({
        variant: "destructive",
        title: "Link de compra não disponível"
      });
      return;
    }
    
    try {
      trackInitiateCheckout(ebook.current_price || undefined);
      
      const newWindow = window.open(ebook.purchase_url, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        toast({
          title: "⚠️ Pop-up bloqueado",
          description: "Clique abaixo para abrir o checkout",
          action: (
            <Button 
              size="sm" 
              onClick={() => window.location.href = ebook.purchase_url!}
            >
              Abrir Checkout
            </Button>
          ),
          duration: 10000,
        });
      } else {
        toast({
          title: "✅ Checkout aberto!",
          description: "Finalize sua compra na nova aba"
        });
      }
    } catch (error) {
      console.error('❌ Erro ao abrir link de compra:', error);
      toast({
        variant: "destructive",
        title: "Erro ao abrir checkout"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <BookOpen className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ebook não encontrado</h2>
          <Button onClick={() => navigate('/library')}>Voltar à biblioteca</Button>
        </div>
      </div>
    );
  }

  // Usar URL pública validada
  const pdfUrlToRender = pdfUrl || ebook.sample_pdf_url || ebook.pdf_url;
  const isLimitedSample = !ebook.sample_pdf_url; // Se não tem amostra dedicada, limitar a 20%

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to={`/ebook/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1 text-center px-4">
              <h1 className="text-sm md:text-base font-semibold truncate">
                {ebook.title} - Amostra Grátis
              </h1>
              <p className="text-xs text-muted-foreground">
                {isLimitedSample 
                  ? `Pág. ${currentPage} de ${sampleMaxPage} (20% grátis)` 
                  : `Página ${currentPage}`}
              </p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="flex-1 bg-muted/20 relative">
        <PDFPageViewer
          pdfUrl={pdfUrlToRender}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          maxPages={isLimitedSample ? sampleMaxPage : undefined}
        />
        
        {/* Bloqueio visual se atingiu o limite */}
        {isLimitedSample && currentPage >= sampleMaxPage && (
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent flex items-end justify-center pb-32 pointer-events-none">
            <div className="bg-card/95 backdrop-blur-md border-2 border-primary/20 rounded-2xl p-8 max-w-md text-center shadow-2xl pointer-events-auto">
              <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Fim da Amostra Grátis</h3>
              <p className="text-muted-foreground mb-4">
                Você leu 20% do conteúdo. Adquira o ebook completo para continuar!
              </p>
              {ebook.purchase_url && (
                <Button
                  variant="premium"
                  size="lg"
                  className="w-full"
                  onClick={handlePurchase}
                >
                  <ShoppingCart className="mr-2" />
                  Comprar Ebook Completo
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <footer className="bg-card border-t border-border sticky bottom-0 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span className="hidden md:inline">
                {isLimitedSample 
                  ? `Amostra grátis - ${sampleMaxPage} de ${ebook.total_pages} páginas`
                  : 'Amostra grátis'}
              </span>
            </div>
            <div className="flex gap-2">
              {ebook.purchase_url && (
                <Button
                  variant="premium"
                  size="sm"
                  onClick={handlePurchase}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Comprar Completo
                </Button>
              )}
              <Link to={`/ebook/${id}`}>
                <Button variant="ghost" size="sm">
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SampleReader;