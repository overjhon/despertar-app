import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gift, BookOpen, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Ebook {
  id: string;
  title: string;
  cover_url: string;
  description: string;
}

interface RewardClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaim: () => void;
}

export const RewardClaimDialog = ({ open, onOpenChange, onClaim }: RewardClaimDialogProps) => {
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableEbooks();
    }
  }, [open]);

  const fetchAvailableEbooks = async () => {
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select('id, title, cover_url, description')
        .eq('is_active', true)
        .limit(5);

      if (error) throw error;
      setEbooks(data || []);
    } catch (error) {
      console.error('Error fetching ebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (ebookId: string) => {
    if (!user) return;

    setClaiming(true);
    try {
      const { error } = await supabase.functions.invoke('claim-purchases', {
        body: { 
          email: user.email,
          claim_type: 'referral_reward',
          ebook_id: ebookId
        }
      });

      if (error) throw error;

      toast({
        title: '🎉 Ebook desbloqueado!',
        description: 'Seu ebook foi adicionado à sua biblioteca!',
      });

      onClaim();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error claiming ebook:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível resgatar o ebook',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Escolha seu Ebook Grátis! 🎁</DialogTitle>
              <DialogDescription>
                Você completou 2 indicações convertidas! Escolha qualquer ebook abaixo:
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-primary animate-pulse" />
          </div>
        ) : (
          <div className="grid gap-4 mt-4">
            {ebooks.map((ebook) => (
              <Card key={ebook.id} className="p-4 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex gap-4">
                  <img
                    src={ebook.cover_url}
                    alt={ebook.title}
                    className="w-24 h-32 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      {ebook.title}
                      <Sparkles className="w-4 h-4 text-primary" />
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {ebook.description}
                    </p>
                    <Button
                      onClick={() => handleClaim(ebook.id)}
                      disabled={claiming}
                      className="w-full sm:w-auto"
                      variant="default"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Resgatar Este Ebook
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
