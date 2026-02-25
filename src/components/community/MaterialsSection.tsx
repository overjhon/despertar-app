import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ExternalLink, Sparkles, Shield, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const MaterialsSection = () => {
  const { user } = useAuth();
  const collshopUrl = 'https://collshp.com/ichisaa/category/2850597?share_channel_code=1&view=storefront';

  const handleClick = async () => {
    // Analytics tracking
    if (user) {
      try {
        await supabase.from('analytics_events').insert({
          event_name: 'collshop_link_clicked',
          user_id: user.id,
          metadata: { source: 'community_tab' }
        });
      } catch (error) {
        console.error('Error tracking analytics:', error);
      }
    }

    window.open(collshopUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Card Principal */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/30 shadow-glow overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-gradient-primary shadow-elegant">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                Materiais de Qualidade
                <Shield className="w-5 h-5 text-primary" />
              </CardTitle>
              <CardDescription className="text-base">
                Compre de fornecedores confiáveis e testados pela comunidade
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Features */}
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-background/60 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Produtos Selecionados</p>
                <p className="text-xs text-muted-foreground">
                  Livros, cursos e recursos para seu desenvolvimento
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-background/60 rounded-lg backdrop-blur-sm">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Fornecedores Verificados</p>
                <p className="text-xs text-muted-foreground">
                  Parceiros testados e aprovados pela comunidade
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-background/60 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Melhores Preços</p>
                <p className="text-xs text-muted-foreground">
                  Condições especiais para nossa comunidade
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleClick}
            size="lg"
            className="w-full gap-2 text-base shadow-glow"
          >
            <ShoppingBag className="w-5 h-5" />
            Comprar na Collshop
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>

          {/* Footer Note */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-xs text-center text-muted-foreground">
              💡 <span className="font-semibold text-foreground">Dica:</span> Ao comprar pelos nossos parceiros, você apoia o crescimento da plataforma e da comunidade!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card Secundário - Dicas */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Dicas para Comprar Materiais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Compare preços e leia avaliações antes de comprar</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Compre em quantidade para economizar no frete</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Peça amostras de essências antes de comprar grandes quantidades</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Compartilhe suas experiências nos posts da comunidade!</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
