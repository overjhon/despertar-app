import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Search, TrendingUp, Heart, BookOpen, ShoppingBag, Filter, Loader2 } from 'lucide-react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { TestimonialCard } from '@/components/community/TestimonialCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { CreatePostDialog } from '@/components/community/CreatePostDialog';
import { PostCard } from '@/components/community/PostCard';
import { TopUsersSection } from '@/components/community/TopUsersSection';
import { ReferralCard } from '@/components/community/ReferralCard';
import { MaterialsSection } from '@/components/community/MaterialsSection';
import { MaterialsCard } from '@/components/community/MaterialsCard';
import { PageSEO } from '@/components/seo/PageSEO';
import { BRAND_NAME, DEFAULT_DESCRIPTION } from '@/config/brand';

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const [postTypeFilter, setPostTypeFilter] = useState('all');
  const [postSortFilter, setPostSortFilter] = useState('recent');
  const [testimonialEbookFilter, setTestimonialEbookFilter] = useState('all');
  const [testimonialRatingFilter, setTestimonialRatingFilter] = useState('all');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { testimonials, loading: testimonialsLoading, toggleLike } = useTestimonials();
  const { posts, loading: postsLoading, hasMore, createPost, deletePost, loadMore } = useCommunityPosts({
    type: postTypeFilter,
    sort: postSortFilter
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Intersection Observer para paginação infinita
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !postsLoading) {
      loadMore();
    }
  }, [hasMore, postsLoading, loadMore]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0
    };
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [handleObserver]);

  const filteredTestimonials = testimonials.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ebooks.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEbook = testimonialEbookFilter === 'all' || t.ebook_id === testimonialEbookFilter;
    const matchesRating = testimonialRatingFilter === 'all' || t.rating === parseInt(testimonialRatingFilter);

    return matchesSearch && matchesEbook && matchesRating;
  });

  const topTestimonials = [...filteredTestimonials].sort((a, b) => b.likes_count - a.likes_count).slice(0, 5);

  const loading = activeTab === 'feed' ? postsLoading : testimonialsLoading;

  // Extrair ebooks únicos dos testimonials para o filtro
  const uniqueEbooks = Array.from(new Set(testimonials.map(t => JSON.stringify({ id: t.ebook_id, title: t.ebooks.title }))))
    .map(str => JSON.parse(str));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Users className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando comunidade...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSEO 
        title={`Comunidade - ${BRAND_NAME}`}
        description={DEFAULT_DESCRIPTION}
        path="/community"
      />
      <div className={`min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-10 shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isMobile && (
                <Link to="/library">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2">
                <Heart className="w-7 h-7 text-primary fill-current animate-pulse" />
                <div>
                  <h1 className="font-heading text-2xl font-bold text-primary">
                    Nossa Comunidade
                  </h1>
                  {!isMobile && <p className="text-sm text-muted-foreground">Compartilhe suas experiências ✨</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Botão de criar post */}
            <CreatePostDialog onCreatePost={createPost} />

            {/* Tabs principais */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="feed">
                  <Heart className="w-4 h-4 mr-2" />
                  Feed
                </TabsTrigger>
                <TabsTrigger value="materiais">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Materiais
                </TabsTrigger>
                <TabsTrigger value="testimonials">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Depoimentos
                </TabsTrigger>
              </TabsList>

              {/* Tab de Feed */}
              <TabsContent value="feed" className="space-y-4 mt-6">
                {/* Filtros do Feed */}
                <div className="flex gap-3 mb-4">
                  <Select value={postTypeFilter} onValueChange={setPostTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="text">📝 Texto</SelectItem>
                      <SelectItem value="image">📷 Fotos</SelectItem>
                      <SelectItem value="video">🎥 Vídeos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={postSortFilter} onValueChange={setPostSortFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">🕒 Recentes</SelectItem>
                      <SelectItem value="likes">❤️ Mais Curtidos</SelectItem>
                      <SelectItem value="comments">💬 Mais Comentados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {posts.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma postagem ainda</h3>
                    <p className="text-muted-foreground mb-4">
                      Seja a primeira a compartilhar algo inspirador! ✨
                    </p>
                  </Card>
                ) : (
                  <>
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onDelete={deletePost}
                      />
                    ))}
                    
                    {/* Elemento observador para paginação infinita */}
                    <div ref={loadMoreRef} className="py-8 text-center">
                      {postsLoading && hasMore && (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <p className="text-muted-foreground">Carregando mais posts...</p>
                        </div>
                      )}
                      {!hasMore && posts.length > 0 && (
                        <p className="text-muted-foreground text-sm">
                          ✨ Você chegou ao final do feed!
                        </p>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Tab de Materiais */}
              <TabsContent value="materiais" className="space-y-4 mt-6">
                <MaterialsSection />
              </TabsContent>

              {/* Tab de Depoimentos */}
              <TabsContent value="testimonials" className="space-y-4 mt-6">
                {/* Filtros e Search */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar depoimentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 rounded-xl border-primary/20 focus:border-primary shadow-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Select value={testimonialEbookFilter} onValueChange={setTestimonialEbookFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Ebook" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os ebooks</SelectItem>
                        {uniqueEbooks.map((ebook: any) => (
                          <SelectItem key={ebook.id} value={ebook.id}>
                            {ebook.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={testimonialRatingFilter} onValueChange={setTestimonialRatingFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Avaliação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas ⭐</SelectItem>
                        <SelectItem value="5">5 estrelas ⭐⭐⭐⭐⭐</SelectItem>
                        <SelectItem value="4">4 estrelas ⭐⭐⭐⭐</SelectItem>
                        <SelectItem value="3">3 estrelas ⭐⭐⭐</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sub-tabs de depoimentos */}
                <Tabs defaultValue="recent" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="recent">Recentes</TabsTrigger>
                    <TabsTrigger value="top">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Mais Curtidos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="recent" className="space-y-4 mt-6">
                    {filteredTestimonials.length === 0 ? (
                      <Card className="p-12 text-center">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum depoimento encontrado</h3>
                        <p className="text-muted-foreground mb-4">
                          Seja o primeiro a compartilhar sua experiência!
                        </p>
                        <Link to="/library">
                          <Button>Ir para Biblioteca</Button>
                        </Link>
                      </Card>
                    ) : (
                      filteredTestimonials.map((testimonial) => (
                        <TestimonialCard
                          key={testimonial.id}
                          testimonial={testimonial}
                          onLike={toggleLike}
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="top" className="space-y-4 mt-6">
                    {topTestimonials.length === 0 ? (
                      <Card className="p-12 text-center">
                        <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Ainda não há depoimentos</h3>
                        <p className="text-muted-foreground">
                          Os depoimentos mais curtidos aparecerão aqui
                        </p>
                      </Card>
                    ) : (
                      topTestimonials.map((testimonial, index) => (
                        <div key={testimonial.id} className="relative">
                          {index < 3 && (
                            <div className="absolute -left-4 top-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm z-10">
                              {index + 1}
                            </div>
                          )}
                          <TestimonialCard
                            testimonial={testimonial}
                            onLike={toggleLike}
                          />
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <MaterialsCard />
              <ReferralCard />
              <TopUsersSection />
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  );
};

export default Community;
