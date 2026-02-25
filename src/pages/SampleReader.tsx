import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Lock, ShoppingCart } from 'lucide-react';
import { PDFPageViewer } from '@/components/reader/PDFPageViewer';
import { trackInitiateCheckout } from '@/lib/facebookPixel';
import { getPublicPdfUrl, getSignedPdfUrl } from '@/lib/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { validateUUIDParam } from '@/lib/validation';

const SampleReader = () => {
  const { id: rawId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Validar UUID antes de usar
  const id = validateUUIDParam(rawId, 'ebook_id');
  const [ebook, setEbook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sampleMaxPage, setSampleMaxPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);



  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) {
      console.error('❌ ID de ebook inválido na URL');
      toast({
        title: "Link inválido",
        description: "O link do ebook está incorreto.",
        variant: "destructive",
      });
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

      // Estratégia: se tem sample_pdf_url, usar URL pública do bucket 'samples'
      // Se não tem, usar o PDF principal via signed URL com limite de páginas
      if (data?.sample_pdf_url) {
        const pdfPath = data.sample_pdf_url;
        const publicUrl = getPublicPdfUrl(pdfPath, 'samples');

        console.log('🔓 Usando URL pública para sample:', publicUrl);
        setPdfUrl(publicUrl);
      } else if (data?.pdf_url) {
        // Sem sample dedicado: usar PDF principal via signed URL
        // O limite de páginas é controlado pelo componente PDFPageViewer (maxPages)
        console.log('📖 Sem sample dedicado, usando PDF principal com limite de páginas');
        const signedUrl = await getSignedPdfUrl(data.pdf_url);

        if (signedUrl) {
          setPdfUrl(signedUrl);
          console.log('✅ URL assinada para amostra obtida');
        } else {
          console.error('❌ Falha ao gerar URL assinada para amostra');
        }
      } else {
        console.warn('⚠️ Ebook não possui nem sample_pdf_url nem pdf_url configurado');
      }
    } catch (error) {
      console.error('Error fetching ebook:', error);
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
  const pdfUrlToRender = pdfUrl;
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