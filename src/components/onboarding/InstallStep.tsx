import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Monitor, Download, CheckCircle2 } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Skeleton } from "@/components/ui/skeleton";

interface InstallStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const InstallStep = ({ onComplete, onSkip }: InstallStepProps) => {
  const { isIOS, isAndroid, isSafari, isChrome, canInstallPWA, promptInstall, isInstalled } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifError, setGifError] = useState(false);
  const isMobile = isIOS || isAndroid;
  const isDesktop = !isMobile;
  const currentUrl = window.location.origin;

  useEffect(() => {
    // Se já instalado, pular automaticamente
    if (isInstalled) {
      onComplete();
    }
  }, [isInstalled, onComplete]);

  const handleInstall = async () => {
    setInstalling(true);

    if (canInstallPWA) {
      const success = await promptInstall();
      setInstalling(false);
      if (success) {
        // Avançar imediatamente após instalação bem-sucedida
        setTimeout(() => onComplete(), 500);
      }
    } else {
      setInstalling(false);
    }
  };

  const renderMobileInstructions = () => {
    if (isIOS && isSafari) {
      return (
        <div className="space-y-4">
          {/* VIDEO Tutorial */}
          <div className="rounded-lg overflow-hidden border-2 border-primary/20 bg-muted/30">
            {!gifLoaded && !gifError && (
              <Skeleton className="w-full h-64" />
            )}
            {gifError ? (
              <div className="w-full h-64 flex items-center justify-center text-muted-foreground bg-muted/50">
                <div className="text-center space-y-2">
                  <p className="text-sm">Tutorial em texto abaixo</p>
                </div>
              </div>
            ) : (
              <video
                src="/ios-install-tutorial.mp4"
                className="w-full"
                autoPlay
                loop
                muted
                playsInline
                onLoadedData={() => setGifLoaded(true)}
                onError={() => setGifError(true)}
                style={{ display: gifLoaded ? 'block' : 'none' }}
              />
            )}
          </div>

          {/* Texto de instrução */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Como instalar no iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Toque no botão "Compartilhar" (ícone de quadrado com seta)</li>
              <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
              <li>Toque em "Adicionar" no canto superior direito</li>
            </ol>
          </div>
        </div>
      );
    }

    if (isAndroid && isChrome) {
      return (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Como instalar no Android:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Toque no menu (três pontos) no canto superior</li>
            <li>Selecione "Instalar app" ou "Adicionar à tela inicial"</li>
            <li>Confirme a instalação</li>
          </ol>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {isMobile ? (
            <Smartphone className="w-8 h-8 text-primary" />
          ) : (
            <Monitor className="w-8 h-8 text-primary" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-foreground">Instalar o App</h2>
        <p className="text-muted-foreground">
          Acesse seus ebooks offline e receba notificações
        </p>
      </div>

      {/* Desktop - QR Code */}
      {isDesktop && (
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <div className="flex justify-center">
            <div className="bg-background p-4 rounded-lg shadow-lg">
              <QRCodeSVG value={currentUrl} size={200} />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="font-medium text-foreground">Escaneie no seu celular</p>
            <p className="text-sm text-muted-foreground">
              Abra a câmera do seu celular e aponte para o QR Code
            </p>
          </div>
        </div>
      )}

      {/* Mobile - Install Button ou Instruções */}
      {isMobile && (
        <div className="space-y-4">
          {canInstallPWA ? (
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full"
              disabled={installing}
            >
              <Download className="mr-2 h-5 w-5" />
              Instalar App Agora
            </Button>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4">
              {renderMobileInstructions()}
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-3 pt-4">
            <p className="text-sm font-medium text-foreground">Benefícios do app:</p>
            <div className="space-y-2">
              {[
                "📱 Acesso rápido sem abrir navegador",
                "⚡ Funciona offline",
                "🔔 Notificações de novos ebooks",
                "💾 Economiza dados móveis",
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skip Button */}
      <Button
        variant="ghost"
        onClick={onSkip}
        className="w-full"
      >
        Continuar sem instalar
      </Button>
    </div>
  );
};
