import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, FileText, ArrowLeft, Lock, Play, Eye, ShoppingCart, Check, Star, RefreshCw } from "lucide-react";
import { useTestimonials } from "@/hooks/useTestimonials";
import { useXP } from "@/hooks/useXP";
import { CreateTestimonialDialog } from "@/components/community/CreateTestimonialDialog";
import { PriceTag } from "@/components/ebooks/PriceTag";
import { CountdownTimer } from "@/components/ebooks/CountdownTimer";
import { ExitIntentModal } from "@/components/ebooks/ExitIntentModal";
import { TestimonialCard } from "@/components/community/TestimonialCard";
import { usePurchaseTracking } from "@/hooks/usePurchaseTracking";
import { LiveActivityWidget } from "@/components/community/LiveActivityWidget";
import { ExternalLink } from "lucide-react";
import { trackViewContent, trackInitiateCheckout } from "@/lib/facebookPixel";
import { useToast } from "@/hooks/use-toast";
import { validateUUIDParam } from "@/lib/validation";

interface Ebook {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string | null;
  category: string | null;
  cover_url: string;
  pdf_url: string;
  sample_pdf_url: string | null;
  total_pages: number;
  estimated_reading_time: number | null;
  tags: string[] | null;
  purchase_url: string | null;
  original_price: number | null;
  current_price: number | null;
  discount_percentage: number | null;
}

interface UserProgress {
  current_page: number;
  progress_percentage: number;
  completed: boolean;
}

const EbookDetail = () => {
  const { id: rawId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Validar UUID antes de usar
  const id = validateUUIDParam(rawId, 'ebook_id');
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [testimonialCount, setTestimonialCount] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
  
  const { testimonials, createTestimonial } = useTestimonials();
  const { addXP } = useXP();
  const { trackClick } = usePurchaseTracking();

  const ebookTestimonials = testimonials.filter(t => t.ebook_id === id).slice(0, 3);

  const handleCreateTestimonial = async (rating: number, title: string, content: string) => {
    const result = await createTestimonial(id!, rating, title, content);
    if (result.success) {
      await addXP({
        amount: 150,
        reason: 'Publicou um depoimento',
        relatedEbookId: id,
      });
    }
    return result;
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
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
    
    fetchEbookDetails();
    fetchTestimonialStats();
  }, [user, id, navigate]);

  useEffect(() => {
    if (ebook && !isPurchased) {
      // Track content view for unpurchased ebooks
      trackViewContent(ebook.title, 'product', ebook.current_price || undefined);
    }
  }, [ebook, isPurchased]);

  const fetchTestimonialStats = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('rating')
        .eq('ebook_id', id)
        .eq('is_public', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const avg = data.reduce((sum, t) => sum + t.rating, 0) / data.length;
        setAvgRating(avg);
        setTestimonialCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching testimonial stats:', error);
    }
  };

  const fetchEbookDetails = async () => {
    if (!id) return;

    try {
      const { data: ebookData, error: ebookError } = await supabase
        .from("ebooks")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (ebookError) {
        console.error('❌ Erro ao buscar ebook:', id, ebookError);
        throw ebookError;
      }
      if (!ebookData) {
        console.warn('⚠️ Ebook não encontrado:', id);
        toast({
          title: "Ebook não encontrado",
          description: "Este ebook não existe ou foi removido.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setEbook(ebookData);

      const { data: purchaseData, error: purchaseError } = await supabase
        .from("user_ebooks")
        .select("id")
        .eq("user_id", user!.id)
        .eq("ebook_id", id)
        .maybeSingle();

      if (purchaseError && purchaseError.code !== "PGRST116") {
        throw purchaseError;
      }

      const hasPurchased = !!purchaseData;
      setIsPurchased(hasPurchased);

      if (hasPurchased) {
        const { data: progressData, error: progressError } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user!.id)
          .eq("ebook_id", id)
          .maybeSingle();

        if (progressError && progressError.code !== "PGRST116") {
          throw progressError;
        }

        setUserProgress(progressData);
      }
    } catch (error) {
      console.error("Error fetching ebook details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReading = async () => {
    if (!ebook || !user || !isPurchased) return;

    try {
      if (!userProgress) {
        const { error } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            ebook_id: ebook.id,
            current_page: 1,
            progress_percentage: 0,
            completed: false,
          });

        if (error) throw error;
      }

      navigate(`/reader/${ebook.id}`);
    } catch (error) {
      console.error("Error starting reading:", error);
    }
  };

  const handleViewSample = () => {
    if (!ebook) return;
    navigate(`/sample/${ebook.id}`);
  };

  const handlePurchase = async () => {
    if (!ebook?.purchase_url) {
      toast({
        variant: "destructive",
        title: "Link de compra não disponível"
      });
      return;
    }
    
    setIsPurchaseLoading(true);
    try {
      await trackClick(ebook.id);
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
      console.error('Erro ao abrir link:', error);
      toast({
        variant: "destructive",
        title: "Erro ao abrir checkout"
      });
    } finally {
      setIsPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Ebook não encontrado</h2>
          <Button onClick={() => navigate("/library")} variant="premium">
            Voltar à Biblioteca
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage = userProgress?.progress_percentage || 0;
  const hasStarted = progressPercentage > 0;

  return (
    <div className="min-h-screen bg-gradient-subtle pb-24 md:pb-0">
      {!isPurchased && ebook.purchase_url && ebook.current_price && (
        <ExitIntentModal 
          ebookTitle={ebook.title}
          currentPrice={ebook.current_price}
          purchaseUrl={ebook.purchase_url}
        />
      )}

      <header className="bg-card/95 backdrop-blur-md border-b border-border fixed top-0 left-0 right-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <Link to="/library">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-20 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pt-8 md:pb-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 animate-scale-in">
            <Card className="overflow-hidden shadow-lg md:sticky md:top-24">
              <div className="aspect-[2/3] relative">
                {!isPurchased && ebook.discount_percentage && (
                  <Badge 
                    variant="destructive" 
                    className="absolute top-4 left-4 z-10 text-base px-4 py-2 animate-pulse"
                  >
                    -{ebook.discount_percentage}% OFF 🔥
                  </Badge>
                )}
                <img
                  src={ebook.cover_url || 'https://via.placeholder.com/300x400?text=' + encodeURIComponent(ebook.title)}
                  alt={ebook.title}
                  className="w-full h-full object-cover"
                />
                {!isPurchased && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <Lock className="w-16 h-16 mx-auto mb-3 text-white" />
                      <span className="text-white font-bold text-lg">BLOQUEADO</span>
                    </div>
                  </div>
                )}
                {isPurchased && userProgress?.completed && (
                  <div className="absolute top-4 right-4 bg-success text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Concluído ✓
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{ebook.title}</h1>
              {ebook.subtitle && (
                <p className="text-xl text-muted-foreground mb-4">{ebook.subtitle}</p>
              )}
              {ebook.author && (
                <p className="text-lg text-foreground/80 mb-4">por {ebook.author}</p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {ebook.category && (
                  <Badge variant="secondary">
                    {ebook.category}
                  </Badge>
                )}
                {avgRating && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(avgRating)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {avgRating.toFixed(1)} ({testimonialCount} avaliações)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {!isPurchased && ebook.original_price && ebook.current_price && ebook.discount_percentage && (
              <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border-2 border-primary/30 shadow-elegant overflow-hidden">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border/50">
                    <div className="flex-1 w-full md:w-auto">
                      <PriceTag
                        originalPrice={ebook.original_price}
                        currentPrice={ebook.current_price}
                        discountPercentage={ebook.discount_percentage}
                        size="lg"
                      />
                    </div>
                    <div className="w-full md:w-auto">
                      <CountdownTimer />
                    </div>
                  </div>

                  <div className="bg-card/60 backdrop-blur-sm rounded-xl p-4 space-y-3 border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-1.5 mt-0.5 flex-shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm md:text-base">Acesso imediato ao conteúdo completo</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-1.5 mt-0.5 flex-shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm md:text-base">7 dias de garantia total</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-1.5 mt-0.5 flex-shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm md:text-base">Suporte completo incluído</span>
                    </div>
                  </div>

                  <Button
                    variant="premium"
                    size="lg"
                    className="w-full text-base md:text-lg h-14 md:h-16 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                    onClick={handlePurchase}
                    disabled={isPurchaseLoading}
                  >
                    {isPurchaseLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Abrindo...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Quero Aproveitar Esta Oferta
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>Pagamento 100% seguro via Cakto</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {isPurchased && hasStarted && (
              <Card className="bg-gradient-card shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Seu Progresso</span>
                    <span className="text-sm font-bold text-primary">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Página {userProgress?.current_page} de {ebook.total_pages}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Páginas</p>
                      <p className="text-lg font-semibold">{ebook.total_pages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {ebook.estimated_reading_time && (
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo estimado</p>
                        <p className="text-lg font-semibold">{ebook.estimated_reading_time} min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          {ebook.description && (
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Sobre o ebook</h3>
                <div className="relative">
                  <p className={`text-muted-foreground leading-relaxed transition-all duration-300 ${
                    isDescriptionExpanded 
                      ? '' 
                      : 'line-clamp-3 md:line-clamp-5'
                  }`}>
                    {ebook.description}
                  </p>
                  {ebook.description.length > 200 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-2 text-primary hover:text-primary/80"
                    >
                      {isDescriptionExpanded ? 'Ver menos ↑' : 'Ver mais ↓'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

            <LiveActivityWidget ebookId={id!} />

            {ebookTestimonials.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-xl">💬 O que nossas leitoras dizem</h3>
                  <Link to={`/ebook/${id}/reviews`}>
                    <Button variant="ghost" size="sm">
                      Ver todas ({ebookTestimonials.length})
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-4">
                  {ebookTestimonials.slice(0, 3).map((testimonial) => (
                    <Card key={testimonial.id} className="p-4">
                      <div className="flex items-start gap-3">
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{testimonial.profiles?.full_name || 'Usuária'}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= testimonial.rating
                                      ? 'fill-primary text-primary'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <h4 className="font-medium mb-1">{testimonial.title}</h4>
                          <p className="text-sm text-muted-foreground">{testimonial.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}


            {/* Botões de ação - Desktop */}
            <div className="hidden md:block space-y-3">
              {isPurchased && userProgress?.completed && (
                <CreateTestimonialDialog
                  ebookId={id!}
                  ebookTitle={ebook.title}
                  onSubmit={handleCreateTestimonial}
                />
              )}
              {isPurchased ? (
                <Button
                  variant="premium"
                  size="lg"
                  className="w-full"
                  onClick={handleStartReading}
                >
                  {hasStarted ? (
                    <>
                      <Eye className="w-5 h-5 mr-2" />
                      Continuar Lendo
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Começar a Ler
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleViewSample}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <BookOpen className="mr-2" />
                  Ver Amostra Grátis
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Botões de ação - Fixos no mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/98 to-background/80 backdrop-blur-md border-t border-border/50 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] z-[60] shadow-2xl">
        <div className="container mx-auto max-w-5xl">
          {isPurchased && userProgress?.completed && (
            <div className="mb-3">
              <CreateTestimonialDialog
                ebookId={id!}
                ebookTitle={ebook.title}
                onSubmit={handleCreateTestimonial}
              />
            </div>
          )}
          {isPurchased ? (
            <Button
              variant="premium"
              size="lg"
              className="w-full h-14 text-base font-bold shadow-lg active:scale-95 transition-transform"
              onClick={handleStartReading}
            >
              {hasStarted ? (
                <>
                  <Eye className="w-5 h-5 mr-2" />
                  Continuar Lendo
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Começar a Ler
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleViewSample}
              size="lg"
              variant="outline"
              className="w-full h-14 text-base font-semibold shadow-lg active:scale-95 transition-transform"
            >
              <BookOpen className="mr-2" />
              Ver Amostra Grátis
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EbookDetail;
