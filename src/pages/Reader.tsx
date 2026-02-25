import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useXP } from '@/hooks/useXP';
import { useStreak } from '@/hooks/useStreak';
import { useBadges } from '@/hooks/useBadges';
import { useChallenges } from '@/hooks/useChallenges';
import { PDFPageViewer } from '@/components/reader/PDFPageViewer';
import { getSignedPdfUrl } from '@/lib/pdfUtils';
import { validateUUIDParam } from '@/lib/validation';

const Reader = () => {
  const { id: rawId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Validar UUID antes de usar
  const id = validateUUIDParam(rawId, 'ebook_id');
  const [ebook, setEbook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [previousPage, setPreviousPage] = useState(1);
  const [startReadTime, setStartReadTime] = useState<Date | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [wasCompleted, setWasCompleted] = useState(false);

  const { addXP } = useXP();
  const { updateStreak } = useStreak();
  const { awardBadge, allBadges } = useBadges();
  const { updateChallengeProgress } = useChallenges();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) {
      console.error('❌ ID de ebook inválido na URL');
      setError('Link inválido. Por favor, verifique o endereço.');
      setLoading(false);
      return;
    }

    fetchEbookAndProgress();
  }, [user, id, navigate]);

  useEffect(() => {
    if (ebook && currentPage > 0) {
      saveProgress();
      trackPageProgress();
    }
  }, [currentPage]);

  useEffect(() => {
    // Update streak when component mounts
    const run = async () => {
      if (user) {
        const result = await updateStreak();
        setStartReadTime(new Date());

        if (result && allBadges && allBadges.length > 0) {
          const { newStreakDays } = result as any;
          if (newStreakDays === 7) {
            const b = allBadges.find((x: any) => x.name === 'Streak 7');
            if (b) await awardBadge(b.id);
          }
          if (newStreakDays === 30) {
            const b30 = allBadges.find((x: any) => x.name === 'Streak 30');
            if (b30) await awardBadge(b30.id);
          }
        }
      }
    };
    run();
  }, [user]);

  const loadingMessages = [
    "✨ Preparando sua leitura...",
    "📚 Carregando páginas...",
    "🎨 Ajustando qualidade...",
    "⚡ Quase lá...",
  ];

  useEffect(() => {
    if (!pdfUrl) {
      const interval = setInterval(() => {
        setLoadingMessage(prev => (prev + 1) % loadingMessages.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [pdfUrl]);

  const fetchEbookAndProgress = async () => {
    try {
      const { data: ebookData, error: ebookError } = await supabase
        .from('ebooks')
        .select('*')
        .eq('id', id)
        .single();

      if (ebookError || !ebookData) {
        console.error('❌ Ebook não encontrado:', id, ebookError);
        setError('Este ebook não foi encontrado. Ele pode ter sido removido ou o link está incorreto.');
        setLoading(false);
        return;
      }

      setEbook(ebookData);

      // Gerar URL assinada (bucket privado) para leitura segura
      if (ebookData?.pdf_url) {
        // Gerar URL assinada (expira em 1h) - requer usuário logado
        const signedUrl = await getSignedPdfUrl(ebookData.pdf_url);

        if (signedUrl) {
          console.log('✅ URL assinada gerada com sucesso para:', ebookData.title);
          setPdfUrl(signedUrl);
          setError(null);
        } else {
          console.error('❌ Falha ao gerar URL assinada para:', ebookData.title);
          setError('PDF não encontrado. Este ebook pode ter sido removido ou estar temporariamente indisponível.');
        }
      } else {
        console.error('❌ Ebook sem pdf_url configurado:', ebookData.id);
        setError('Este ebook não possui conteúdo disponível no momento.');
      }

      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id)
        .eq('ebook_id', id)
        .maybeSingle();

      if (progressData) {
        setCurrentPage(progressData.current_page || 1);
        setWasCompleted(Boolean(progressData.completed));
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Erro ao carregar ebook');
    } finally {
      setLoading(false);
    }
  };

  const trackPageProgress = async () => {
    if (!ebook || !user || currentPage === previousPage) return;

    // Award XP for reading a page
    if (currentPage > previousPage) {
      const pagesRead = currentPage - previousPage;
      const xpPerPage = 10;
      const totalXP = pagesRead * xpPerPage;

      await addXP({
        amount: totalXP,
        reason: `Leu ${pagesRead} página${pagesRead > 1 ? 's' : ''}`,
        relatedEbookId: id,
        showToast: true,
      });

      // Update challenge progress for pages read
      await updateChallengeProgress('pages_read', pagesRead);

      // Get current gamification stats
      const { data: currentGam } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (currentGam) {
        const todayStr = new Date().toISOString().split('T')[0];
        const newPagesReadToday = currentGam.last_read_date === todayStr
          ? (currentGam.pages_read_today || 0) + pagesRead
          : pagesRead;
        const newBestDaily = Math.max(currentGam.best_daily_pages || 0, newPagesReadToday);

        await supabase
          .from('user_gamification')
          .update({
            pages_read_today: newPagesReadToday,
            total_pages_read: (currentGam.total_pages_read || 0) + pagesRead,
            best_daily_pages: newBestDaily,
            last_page_read_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        // Check for Maratonista badge (100 pages in a day)
        if (newPagesReadToday >= 100) {
          const marathonBadge = allBadges.find(b => b.name === 'Maratonista');
          if (marathonBadge) {
            await awardBadge(marathonBadge.id);
          }
        }
      }

      // Update/create daily reading stats (fallback direto sem RPC)
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyStats } = await supabase
        .from('daily_reading_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (dailyStats) {
        await supabase
          .from('daily_reading_stats')
          .update({
            pages_read: dailyStats.pages_read + pagesRead,
            xp_earned: dailyStats.xp_earned + totalXP,
          })
          .eq('id', dailyStats.id);
      } else {
        await supabase.from('daily_reading_stats').insert({
          user_id: user.id,
          date: today,
          pages_read: pagesRead,
          xp_earned: totalXP,
        });
      }
    }

    setPreviousPage(currentPage);
  };

  const saveProgress = async () => {
    if (!ebook) return;

    const progressPercentage = (currentPage / ebook.total_pages) * 100;
    const isCompleted = currentPage >= ebook.total_pages;

    await supabase
      .from('user_progress')
      .upsert({
        user_id: user?.id,
        ebook_id: id,
        current_page: currentPage,
        progress_percentage: progressPercentage,
        last_read_at: new Date().toISOString(),
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,ebook_id'
      });

    // Check if ebook just got completed
    if (isCompleted && !wasCompleted) {
      await handleEbookCompletion();
      setWasCompleted(true);
    }
  };

  const handleEbookCompletion = async () => {
    if (!user || !ebook) return;

    // Increment books completed counter
    const { data: currentGamData } = await supabase
      .from('user_gamification')
      .select('books_completed')
      .eq('user_id', user.id)
      .single();

    await supabase
      .from('user_gamification')
      .update({
        books_completed: (currentGamData?.books_completed || 0) + 1,
      })
      .eq('user_id', user.id);

    // Update daily stats for book completion
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyStats } = await supabase
      .from('daily_reading_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (dailyStats) {
      await supabase
        .from('daily_reading_stats')
        .update({
          books_completed: dailyStats.books_completed + 1,
        })
        .eq('id', dailyStats.id);
    } else {
      await supabase
        .from('daily_reading_stats')
        .insert({
          user_id: user.id,
          date: today,
          books_completed: 1,
        });
    }

    // Award completion XP
    const completionXP = 500 + Math.floor(ebook.total_pages / 10) * 10;
    await addXP({
      amount: completionXP,
      reason: `Completou: ${ebook.title}`,
      relatedEbookId: id,
      showToast: true,
    });

    // Update challenge progress for ebooks completed
    await updateChallengeProgress('ebooks_completed', 1);

    // Check for completion badges
    const { data: completedCount } = await supabase
      .from('user_progress')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('completed', true);

    const count = completedCount?.length || 0;

    // Award badges based on completion count
    const completionBadges = [
      { count: 1, name: 'Primeiro Passo' },
      { count: 5, name: 'Leitor Dedicado' },
      { count: 10, name: 'Mestre dos Livros' },
    ];

    for (const { count: requiredCount, name } of completionBadges) {
      if (count === requiredCount) {
        const badge = allBadges.find(b => b.name === name);
        if (badge) {
          await awardBadge(badge.id);
        }
      }
    }

    // Check for Velocista badge (complete in less than 48 hours)
    if (startReadTime) {
      const completionTime = new Date();
      const hoursToComplete = (completionTime.getTime() - startReadTime.getTime()) / (1000 * 60 * 60);

      if (hoursToComplete < 48) {
        const speedBadge = allBadges.find(b => b.name === 'Velocista');
        if (speedBadge) {
          await awardBadge(speedBadge.id);
        }
      }
    }

    // Check for Explorador badge (3 different categories)
    const { data: categories } = await supabase
      .from('user_progress')
      .select('ebooks!inner(category)')
      .eq('user_id', user.id)
      .eq('completed', true);

    if (categories) {
      const uniqueCategories = new Set(categories.map((c: any) => c.ebooks.category));
      if (uniqueCategories.size >= 3) {
        const explorerBadge = allBadges.find(b => b.name === 'Explorador');
        if (explorerBadge) {
          await awardBadge(explorerBadge.id);
        }
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/ebook/${id}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-sm md:text-base font-semibold truncate max-w-xs md:max-w-md">
              {ebook.title}
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="flex-1 flex flex-col">
        {!pdfUrl ? (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
            <div className="text-center space-y-4 animate-in fade-in duration-500">
              <div className="relative">
                <BookOpen className="w-16 h-16 text-primary mx-auto animate-pulse" />
                <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground animate-in slide-in-from-bottom-2 duration-300">
                  {loadingMessages[loadingMessage]}
                </p>
                <div className="w-48 mx-auto">
                  <Progress value={undefined} className="h-1" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto px-4">
                Estamos preparando <span className="font-medium text-foreground">{ebook?.title}</span> para você. A leitura ficará incrível! 🚀
              </p>
              {error && (
                <div className="mt-4">
                  <p className="text-sm text-destructive mb-2">{error}</p>
                  <Button onClick={() => fetchEbookAndProgress()} variant="outline" size="sm">
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <PDFPageViewer
            pdfUrl={pdfUrl}
            currentPage={currentPage}
            totalPages={ebook.total_pages}
            onPageChange={handlePageChange}
            ebookTitle={ebook.title}
            onRetry={() => fetchEbookAndProgress()}
          />
        )}
      </main>
    </div>
  );
};

export default Reader;