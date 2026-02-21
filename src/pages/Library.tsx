import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, LogOut, User, Lock, Upload, Trophy, Target, Heart, Sparkles, ShoppingCart, RefreshCw, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useIsMobile } from '@/hooks/useIsMobile';
import { PriceTag } from '@/components/ebooks/PriceTag';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseTracking } from '@/hooks/usePurchaseTracking';
import { toast } from '@/hooks/use-toast';
import { InstallAppButton } from '@/components/pwa/InstallAppButton';
import { PageSEO } from '@/components/seo/PageSEO';
import { BRAND_NAME, DEFAULT_DESCRIPTION } from '@/config/brand';
import { trackInitiateCheckout } from '@/lib/facebookPixel';

interface Ebook {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string | null;
  cover_url: string;
  total_pages: number;
  estimated_reading_time: number | null;
  category: string | null;
  purchase_url: string | null;
  original_price: number | null;
  current_price: number | null;
  discount_percentage: number | null;
  isPurchased?: boolean;
}

interface UserProgress {
  ebook_id: string;
  current_page: number;
  progress_percentage: number;
  completed: boolean;
}

const Library = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { trackClick } = usePurchaseTracking();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [levelName, setLevelName] = useState('');

  const { gamificationData } = useGamification();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const initializeLibrary = async () => {
      // Auto-claim purchases silently
      try {
        const { data, error } = await supabase.functions.invoke('claim-purchases');

        if (!error && data?.claimed_count > 0) {
          const ebookNames = data.ebooks?.slice(0, 2).join(', ') || 'seus ebooks';
          toast({
            title: "🎉 Parabéns pela compra!",
            description: `${ebookNames} ${data.claimed_count > 2 ? `e mais ${data.claimed_count - 2}` : ''} liberado${data.claimed_count > 1 ? 's' : ''}!`,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('[AUTO-CLAIM] Error:', error);
      }

      fetchAllEbooks();
      checkAdminStatus();
    };

    initializeLibrary();
  }, [user, navigate]);

  useEffect(() => {
    const fetchLevelName = async () => {
      if (gamificationData) {
        const { data } = await supabase.rpc('get_level_name', { level: gamificationData.current_level });
        setLevelName(data || '');
      }
    };
    fetchLevelName();
  }, [gamificationData]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin:', error);
    }
  };

  const fetchAllEbooks = async () => {
    try {
      const { data: ebooksData, error: ebooksError } = await supabase
        .from('ebooks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (ebooksError) throw ebooksError;

      const { data: userEbooks, error: userEbooksError } = await supabase
        .from('user_ebooks')
        .select('ebook_id')
        .eq('user_id', user?.id);

      if (userEbooksError) throw userEbooksError;

      const purchasedIds = new Set(userEbooks?.map(ue => ue.ebook_id) || []);

      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      if (progressError) throw progressError;

      const progressMap = (progressData || []).reduce((acc, p) => {
        acc[p.ebook_id] = p;
        return acc;
      }, {} as Record<string, UserProgress>);

      const ebooksWithPurchaseStatus = (ebooksData || []).map(ebook => ({
        ...ebook,
        isPurchased: purchasedIds.has(ebook.id) || ebook.current_price === 0 || ebook.current_price === null
      }));

      setEbooks(ebooksWithPurchaseStatus);
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching ebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEbooks = ebooks.filter(ebook =>
    ebook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ebook.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const continueReading = filteredEbooks.filter(e =>
    e.isPurchased && progress[e.id] && progress[e.id].progress_percentage > 0 && !progress[e.id].completed
  );

  const purchasedEbooks = filteredEbooks.filter(e => e.isPurchased);
  const lockedEbooks = filteredEbooks.filter(e => !e.isPurchased);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={`Minha Biblioteca - ${BRAND_NAME}`}
        description={DEFAULT_DESCRIPTION}
        path="/library"
      />
      <div className={`min-h-screen bg-gradient-subtle ${isMobile ? 'pb-20' : ''}`}>
        <header className="bg-card/95 backdrop-blur-lg border-b border-primary/20 sticky top-0 z-10 shadow-elegant">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    {BRAND_NAME}
                  </h1>
                  <p className="text-xs text-muted-foreground">Sua biblioteca pessoal ✨</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMobile && (
                  <InstallAppButton
                    variant="ghost"
                    size="icon"
                    hideText={true}
                    showIcon={true}
                  />
                )}

                {gamificationData && levelName && !isMobile && (
                  <LevelBadge level={gamificationData.current_level} levelName={levelName} />
                )}

                {isAdmin && (
                  <>
                    <Link to="/admin/manage">
                      <Button variant="outline" size="sm" className="gap-2">
                        <BookOpen className="w-4 h-4" />
                        {!isMobile && "Gerenciar"}
                      </Button>
                    </Link>
                    <Link to="/admin/upload">
                      <Button variant="default" size="sm" className="gap-2">
                        <Upload className="w-4 h-4" />
                        {!isMobile && "Upload"}
                      </Button>
                    </Link>
                  </>
                )}
                <NotificationBell />
                {!isMobile && (
                  <>
                    <Link to="/challenges">
                      <Button variant="ghost" size="icon" title="Desafios">
                        <Target className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to="/leaderboard">
                      <Button variant="ghost" size="icon" title="Ranking">
                        <Trophy className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to="/community">
                      <Button variant="ghost" size="icon" title="Comunidade">
                        <Heart className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="ghost" size="icon" title="Meu Perfil">
                        <User className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl space-y-12">
          <div className="mb-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-primary" />
              <Input
                type="search"
                placeholder="Buscar seus livros favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base rounded-2xl border-2 border-primary/30 focus:border-primary shadow-elegant focus:shadow-glow transition-all duration-300"
              />
            </div>
          </div>

          {continueReading.length > 0 && (
            <section className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-primary" />
                Continue sua Leitura
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {continueReading.map((ebook) => (
                  <EbookCard key={ebook.id} ebook={ebook} progress={progress[ebook.id]} isPurchased={true} trackClick={trackClick} />
                ))}
              </div>
            </section>
          )}

          {purchasedEbooks.length > 0 && (
            <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Heart className="w-6 h-6 text-primary" />
                Minha Coleção ({purchasedEbooks.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchasedEbooks.map((ebook) => (
                  <EbookCard key={ebook.id} ebook={ebook} progress={progress[ebook.id]} isPurchased={true} trackClick={trackClick} />
                ))}
              </div>
            </section>
          )}

          {lockedEbooks.length > 0 && (
            <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-primary rounded-full"></span>
                Disponíveis para Compra ({lockedEbooks.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lockedEbooks.map((ebook) => (
                  <EbookCard key={ebook.id} ebook={ebook} progress={null} isPurchased={false} trackClick={trackClick} />
                ))}
              </div>
            </section>
          )}

          {filteredEbooks.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Nenhum ebook encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente buscar por outro termo' : 'Nenhum ebook disponível no momento'}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

const EbookCard = ({
  ebook,
  progress,
  isPurchased,
  trackClick
}: {
  ebook: Ebook;
  progress?: UserProgress | null;
  isPurchased: boolean;
  trackClick: (ebookId: string) => Promise<void>;
}) => {
  const progressPercentage = progress?.progress_percentage || 0;
  const isCompleted = progress?.completed || false;
  const navigate = useNavigate();
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);

  const handlePurchaseClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ebook.purchase_url) return;

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
      console.error('❌ Erro ao abrir link de compra:', error);
      toast({
        variant: "destructive",
        title: "Erro ao abrir checkout"
      });
    } finally {
      setIsPurchaseLoading(false);
    }
  };

  const handleViewSample = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/sample/${ebook.id}`);
  };

  return (
    <Link to={`/ebook/${ebook.id}`}>
      <Card className="group hover:shadow-glow transition-all duration-300 hover:scale-[1.03] cursor-pointer overflow-hidden border-2 border-primary/10 hover:border-primary/30">
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-card">
          {!isPurchased && ebook.discount_percentage && (
            <Badge
              variant="destructive"
              className="absolute top-3 left-3 z-10 animate-pulse text-sm px-3 py-1"
            >
              -{ebook.discount_percentage}% OFF 🔥
            </Badge>
          )}
          <img
            src={ebook.cover_url || 'https://via.placeholder.com/300x400?text=' + encodeURIComponent(ebook.title)}
            alt={ebook.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isPurchased ? 'blur-[2px] group-hover:blur-none' : ''}`}
          />
          {!isPurchased && (
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 flex items-center justify-center backdrop-blur-[1px] transition-all">
              <div className="text-center px-4">
                <Lock className="w-10 h-10 mx-auto mb-2 text-white" />
                <span className="text-white font-bold text-sm">DESBLOQUEIE AGORA</span>
              </div>
            </div>
          )}
          {isPurchased && isCompleted && (
            <div className="absolute top-3 right-3 bg-success text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              Concluído ✓
            </div>
          )}
          {isPurchased && progressPercentage > 0 && !isCompleted && (
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              {Math.round(progressPercentage)}%
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{ebook.title}</h3>
          {ebook.author && (
            <p className="text-sm text-muted-foreground">{ebook.author}</p>
          )}

          {!isPurchased && ebook.original_price && ebook.current_price && ebook.discount_percentage && (
            <div className="space-y-2">
              <PriceTag
                originalPrice={ebook.original_price}
                currentPrice={ebook.current_price}
                discountPercentage={ebook.discount_percentage}
                size="sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-primary text-primary hover:bg-primary/10"
                  onClick={handleViewSample}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  <span className="text-xs">Ver Amostra</span>
                </Button>
                <Button
                  variant="premium"
                  size="sm"
                  className="w-full"
                  onClick={handlePurchaseClick}
                  disabled={isPurchaseLoading}
                >
                  {isPurchaseLoading ? (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      <span className="text-xs">Abrindo...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-1 h-3 w-3" />
                      <span className="text-xs">Comprar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {isPurchased && progressPercentage > 0 && (
            <Progress value={progressPercentage} className="h-2" />
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default Library;
