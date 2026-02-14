import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Smartphone, Monitor, Zap, Wifi, Bell, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import iosInstallGif from '@/assets/ios-install-tutorial.gif';

interface InstallInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InstallInstructions = ({ open, onOpenChange }: InstallInstructionsProps) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const benefits = [
    { icon: Zap, text: 'Acesso ultra rápido' },
    { icon: Wifi, text: 'Funciona offline' },
    { icon: Bell, text: 'Receba notificações' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="install-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isIOS || isAndroid ? <Smartphone className="w-6 h-6 text-primary" /> : <Monitor className="w-6 h-6 text-primary" />}
            📱 Instalar na Tela Inicial
          </DialogTitle>
          <DialogDescription id="install-description" className="text-muted-foreground">
            Tenha acesso rápido e experiência otimizada
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Benefits */}
          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-primary">✨</span> Por que instalar?
              </h3>
              <div className="space-y-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <benefit.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="space-y-3">
            {isIOS && (
              <div className="space-y-2">
                <p className="font-semibold text-base">Para instalar no iPhone/iPad:</p>
                <ol className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      1
                    </div>
                    <span className="text-sm pt-0.5">
                      Toque no botão <strong>Compartilhar</strong> (quadrado com seta para cima) no Safari
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      2
                    </div>
                    <span className="text-sm pt-0.5">
                      Role para baixo e encontre <strong>"Adicionar à Tela Inicial"</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      3
                    </div>
                    <span className="text-sm pt-0.5">
                      Toque em <strong>"Adicionar"</strong> no canto superior direito
                    </span>
                  </li>
                </ol>
                
                {/* iOS Installation Tutorial GIF */}
                <div className="mt-4 rounded-lg overflow-hidden border border-primary/20 shadow-lg">
                  <img 
                    src={iosInstallGif}
                    alt="Tutorial animado mostrando como instalar o app no iPhone e iPad"
                    className="w-full h-auto"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground text-center italic mt-2">
                  ☝️ Siga os passos mostrados acima
                </p>
              </div>
            )}
            
            {isAndroid && (
              <div className="space-y-2">
                <p className="font-semibold text-base">Para instalar no Android:</p>
                <ol className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      1
                    </div>
                    <span className="text-sm pt-0.5">
                      Toque nos <strong>3 pontos</strong> no canto superior direito do Chrome
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      2
                    </div>
                    <span className="text-sm pt-0.5">
                      Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      3
                    </div>
                    <span className="text-sm pt-0.5">
                      Confirme tocando em <strong>"Adicionar"</strong>
                    </span>
                  </li>
                </ol>
              </div>
            )}
            
            {!isIOS && !isAndroid && (
              <div className="space-y-2">
                <p className="font-semibold text-base">Para instalar no computador:</p>
                <ol className="space-y-2">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      1
                    </div>
                    <span className="text-sm pt-0.5">
                      Procure o ícone de <strong>instalação</strong> (⊕ ou ⬇) na barra de endereços
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      2
                    </div>
                    <span className="text-sm pt-0.5">
                      Ou abra o menu (⋮) e selecione <strong>"Instalar MundoDelas"</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-primary">
                      3
                    </div>
                    <span className="text-sm pt-0.5">
                      Confirme a instalação clicando em <strong>"Instalar"</strong>
                    </span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Success Message */}
          <Card className="bg-success/10 border-success/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-success">
                  Após instalar, o app aparecerá na sua tela inicial! 🎉
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
