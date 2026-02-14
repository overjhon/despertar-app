import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Filter } from 'lucide-react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { ReviewCard } from '@/components/community/ReviewCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export const ReviewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { testimonials, loading, toggleLike } = useTestimonials();
  const [filter, setFilter] = useState<string>('recent');

  const ebookTestimonials = testimonials.filter(t => t.ebook_id === id);

  const filteredTestimonials = [...ebookTestimonials].sort((a, b) => {
    switch (filter) {
      case 'helpful':
        return b.likes_count - a.likes_count;
      case 'rating-high':
        return b.rating - a.rating;
      case 'rating-low':
        return a.rating - b.rating;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const averageRating = ebookTestimonials.length > 0
    ? ebookTestimonials.reduce((sum, t) => sum + t.rating, 0) / ebookTestimonials.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    stars: rating,
    count: ebookTestimonials.filter(t => t.rating === rating).length,
    percentage: ebookTestimonials.length > 0
      ? (ebookTestimonials.filter(t => t.rating === rating).length / ebookTestimonials.length) * 100
      : 0,
  }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Todas as Avaliações</h1>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-1 bg-card p-6 rounded-lg border">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                <div className="flex justify-center mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {ebookTestimonials.length} avaliações
                </p>
              </div>

              <div className="space-y-2">
                {ratingDistribution.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-12">{stars} ⭐</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {filteredTestimonials.length} avaliações
                </h2>

                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="helpful">Mais úteis</SelectItem>
                    <SelectItem value="rating-high">Maior avaliação</SelectItem>
                    <SelectItem value="rating-low">Menor avaliação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredTestimonials.map(testimonial => (
                  <ReviewCard
                    key={testimonial.id}
                    review={testimonial}
                    onLike={toggleLike}
                    onComment={() => {}}
                    showVerifiedBadge
                  />
                ))}

                {filteredTestimonials.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhuma avaliação encontrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
