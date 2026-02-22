import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Users, Gift, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useReferrals } from '@/hooks/useReferrals';
import { RewardClaimDialog } from './RewardClaimDialog';
import { Progress } from '@/components/ui/progress';

export const ReferralCard = () => {
  const { myReferralCode, createReferralCode, stats, refetch } = useReferrals();
  const [showRewardDialog, setShowRewardDialog] = useState(false);

  const progress = Math.min((stats.converted / 2) * 100, 100);
  const canClaimReward = stats.converted >= 2;

  const copyToClipboard = () => {
    if (myReferralCode) {
      const shareUrl = `${window.location.origin}/signup?ref=${myReferralCode}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe com suas amigas e ganhe recompensas!',
      });
    }
  };

  const shareViaWhatsApp = () => {
    if (myReferralCode) {
      const shareUrl = `${window.location.origin}/signup?ref=${myReferralCode}`;
      const message = `Olá! 🌟 Descobri essa plataforma incrível de ebooks para o despertar feminino! Use meu link para se cadastrar: ${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  return (
    <>
      <RewardClaimDialog
        open={showRewardDialog}
        onOpenChange={setShowRewardDialog}
        onClaim={refetch}
      />
      <Card className="p-6 bg-gradient-card shadow-glow border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Indique & Ganhe</h3>
              <p className="text-sm text-muted-foreground">
                Convide amigas e ganhe recompensas incríveis!
              </p>
            </div>
          </div>

          {!myReferralCode ? (
            <Button
              onClick={createReferralCode}
              className="w-full"
              variant="default"
            >
              Gerar Meu Código de Indicação
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-background rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Seu código:</p>
                <p className="font-mono font-bold text-2xl text-primary tracking-wider">
                  {myReferralCode}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Link
                </Button>
                <Button
                  onClick={shareViaWhatsApp}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-primary/10">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                    <Users className="w-5 h-5" />
                    {stats.converted}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Convertidas</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-secondary">
                    <Gift className="w-5 h-5" />
                    {stats.converted * 500}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">XP Ganho</p>
                </div>
              </div>

              {/* Progresso para ebook grátis */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Progresso para Ebook Grátis</p>
                  <p className="text-sm font-bold text-primary">{stats.converted}/2</p>
                </div>
                <Progress value={progress} className="h-2 mb-2" />
                {canClaimReward ? (
                  <Button
                    onClick={() => setShowRewardDialog(true)}
                    variant="default"
                    size="sm"
                    className="w-full gap-2 animate-pulse"
                  >
                    <Sparkles className="w-4 h-4" />
                    Resgatar Ebook Grátis!
                  </Button>
                ) : (
                  <p className="text-xs text-center text-muted-foreground">
                    Faltam {2 - stats.converted} conversões para ganhar um ebook grátis!
                  </p>
                )}
              </div>

              <div className="p-3 bg-secondary/5 rounded-lg">
                <p className="text-xs text-center">
                  💡 <span className="font-semibold">Ganhe 500 XP</span> por indicação convertida + <span className="font-semibold">1 ebook grátis</span> a cada 2 conversões!
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};
