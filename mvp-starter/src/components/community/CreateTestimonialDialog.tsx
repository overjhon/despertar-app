import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { testimonialTitleSchema, testimonialContentSchema, ratingSchema } from '@/lib/validation';
import { toast } from 'sonner';

interface CreateTestimonialDialogProps {
  ebookId: string;
  ebookTitle: string;
  onSubmit: (rating: number, title: string, content: string) => Promise<{ success: boolean }>;
}

export const CreateTestimonialDialog = ({ ebookId, ebookTitle, onSubmit }: CreateTestimonialDialogProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate title
    const titleValidation = testimonialTitleSchema.safeParse(title);
    if (!titleValidation.success) {
      toast.error(titleValidation.error.errors[0].message);
      return;
    }

    // Validate content
    const contentValidation = testimonialContentSchema.safeParse(content);
    if (!contentValidation.success) {
      toast.error(contentValidation.error.errors[0].message);
      return;
    }

    // Validate rating
    const ratingValidation = ratingSchema.safeParse(rating);
    if (!ratingValidation.success) {
      toast.error(ratingValidation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const result = await onSubmit(ratingValidation.data, titleValidation.data, contentValidation.data);
    setLoading(false);

    if (result.success) {
      setTitle('');
      setContent('');
      setRating(5);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <MessageSquarePlus className="w-4 h-4" />
          Escrever Depoimento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compartilhar sua opinião</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Sobre: {ebookTitle}</Label>
          </div>

          {/* Rating */}
          <div>
            <Label>Avaliação</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={cn(
                    "text-3xl transition-colors",
                    star <= rating ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Um título para seu depoimento"
              maxLength={100}
              required
              className="mt-1"
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Depoimento</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Compartilhe sua experiência com este ebook..."
              rows={5}
              maxLength={1000}
              required
              className="mt-1 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/1000 caracteres
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
