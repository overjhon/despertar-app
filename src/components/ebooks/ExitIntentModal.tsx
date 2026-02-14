import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, ShoppingCart, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExitIntentModalProps {
  ebookTitle: string;
  currentPrice: number;
  purchaseUrl: string;
}

export const ExitIntentModal = ({ ebookTitle, currentPrice, purchaseUrl }: ExitIntentModalProps) => {
  const [showModal, setShowModal] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setShowModal(true);
        setHasShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown]);

  const handlePurchase = () => {
    const newWindow = window.open(purchaseUrl, '_blank', 'noopener,noreferrer');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Fallback: redirecionar na mesma aba
      window.location.href = purchaseUrl;
    }
    
    setShowModal(false);
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-lg border-primary/20">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-gradient-primary p-3 rounded-full">
              <Gift className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl md:text-3xl text-center leading-tight">
            Espere! Não perca esta oferta
          </DialogTitle>
          <DialogDescription className="text-base space-y-6">
            <p className="font-semibold text-foreground text-center text-lg">
              Desconto extra de 10% em "{ebookTitle}"
            </p>
            
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-2xl p-6 text-center shadow-elegant">
              <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">Use o código</p>
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 mb-3 border border-primary/20">
                <code className="text-2xl md:text-3xl font-bold text-primary tracking-wider">PRIMEIRA10</code>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Aplicável no checkout
              </p>
            </div>

            <div className="space-y-3 bg-card/50 rounded-xl p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm flex-1">Acesso imediato ao conteúdo completo</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm flex-1">7 dias de garantia total</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm flex-1">Suporte completo incluído</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-2">
          <Button
            size="lg"
            variant="premium"
            className="w-full text-base md:text-lg h-14 shadow-lg hover:shadow-xl transition-all"
            onClick={handlePurchase}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Aproveitar Oferta Especial
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShowModal(false)}
          >
            Continuar navegando
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
