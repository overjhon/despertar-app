import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, CheckCircle2, Share2, Chrome, AlertCircle, Monitor } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useAuth } from '@/contexts/AuthContext';
import { useXP } from '@/hooks/useXP';
import { useBadges } from '@/hooks/useBadges';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logoTransparente from '@/assets/logo-sem-fundo.png';
import iosGif from '@/assets/ios-install-tutorial.gif';

const Install = () => {
  const {
    isInstalled,
    isInstallable,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    canInstallPWA,
    promptInstall,
    checkIOSStandalone
  } = useInstallPrompt();

  const { user } = useAuth();
  const { addXP } = useXP();
  const { awardBadge } = useBadges();

  const [installing, setInstalling] = useState(false);
  const [waitingForPrompt, setWaitingForPrompt] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifError, setGifError] = useState(false);
  const [rewardProcessed, setRewardProcessed] = useState(false);

  // Verificar status da recompensa no servidor (NUNCA usar localStorage)
  useEffect(() => {
    const checkRewardStatus = async () => {
      if (!user) return;

      const { data: gamData, error } = await supabase
        .from('user_gamification')
        .select('install_reward_claimed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar status da recompensa:', error);
        return;
      }

      if (gamData?.install_reward_claimed) {
        setRewardProcessed(true);
      }
    };

    checkRewardStatus();
  }, [user]);

  // Dar recompensa quando instalar
  const giveInstallationReward = async () => {
    if (!user || rewardProcessed) return;

    try {
      // Verificar novamente antes de processar (prevenir race condition)
      const { data: gamData } = await supabase
        .from('user_gamification')
        .select('install_reward_claimed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (gamData?.install_reward_claimed) {
        setRewardProcessed(true);
        return;
      }

      // Marcar como processado no banco de dados
      const { error: updateError } = await supabase
        .from('user_gamification')
        .update({ install_reward_claimed: true })
        .eq('user_id', user.id)
        .eq('install_reward_claimed', false);

      if (updateError) {
        console.error('Erro ao marcar recompensa:', updateError);
        return;
      }

      setRewardProcessed(true);

      // Dar XP
      await addXP({
        amount: 50,
        reason: 'Instalou o app PWA',
      });

      // Dar badge Early Adopter
      await awardBadge('early-adopter');

      toast.success('🎉 Parabéns! Você ganhou 50 XP e o badge Early Adopter!');
    } catch (error) {
      console.error('Erro ao dar recompensa:', error);
    }
  };

  // Detecção iOS standalone (quando abre o app após instalar)
  // SEGURANÇA: Apenas detecta standalone, mas não dá recompensa automática
  useEffect(() => {
    const checkIOSInstallation = async () => {
      if (!isIOS || rewardProcessed) return;

      const isStandalone = checkIOSStandalone();

      // Apenas mostra mensagem se estiver em standalone
      if (isStandalone) {
        console.log('App rodando em modo standalone (instalado)');
        // Usuário DEVE clicar no botão manualmente para receber recompensa
      }
    };

    checkIOSInstallation();
  }, [isIOS, rewardProcessed]);

  // Confirmar instalação iOS manualmente
  const handleIOSInstallationConfirm = async () => {
    await giveInstallationReward();
  };

  const handleInstall = async () => {
    setInstalling(true);

    if (isInstallable) {
      // Prompt disponível - instalar imediatamente
      const success = await promptInstall();
      setInstalling(false);

      if (!success) {
        // Se falhou, mostrar dica manual
        setWaitingForPrompt(false);
      }
    } else if (canInstallPWA && !isInstallable) {
      // Browser suporta mas prompt ainda não veio - aguardar
      setWaitingForPrompt(true);

      // Timeout de 3 segundos
      setTimeout(() => {
        setInstalling(false);
        setWaitingForPrompt(false);
      }, 3000);
    } else {
      setInstalling(false);
    }
  };

  // Resetar waitingForPrompt quando prompt chegar
  useEffect(() => {
    if (isInstallable && waitingForPrompt) {
      setWaitingForPrompt(false);
      handleInstall();
    }
  }, [isInstallable]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="bg-gradient-primary text-white py-12 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src={logoTransparente}
              alt="Despertar da Mulher"
              className="w-32 h-32 mx-auto object-contain drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center text-white text-4xl font-bold';
                fallback.textContent = 'DM';
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
            Instale o App Despertar da Mulher
          </h1>

          <p className="text-lg text-white/90 mb-2 max-w-xl mx-auto">
            Acesse seus ebooks offline, receba notificações e tenha uma experiência otimizada
          </p>

          <p className="text-base text-white/80 mb-8 max-w-xl mx-auto">
            Depois de instalar, você poderá criar sua conta e acessar todo o conteúdo
          </p>

          {isInstalled && (
            <div className="inline-flex items-center gap-2 bg-white/20 px-6 py-3 rounded-full backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">App já instalado!</span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* iOS - Mostrar instruções com GIF diretamente */}
        {isIOS && !isInstalled && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6 space-y-4">
              {!isSafari ? (
                <div className="bg-accent/50 border border-accent-foreground/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-accent-foreground mb-1">
                      Abra no Safari
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Para instalar o app no iPhone/iPad, você precisa abrir este site no navegador Safari
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold font-heading">
                    Como instalar no iPhone/iPad
                  </h2>

                  <div className="rounded-lg overflow-hidden border-2 border-primary/20 bg-muted/30">
                    {!gifLoaded && !gifError && (
                      <Skeleton className="w-full h-96" />
                    )}
                    {gifError ? (
                      <div className="w-full h-96 flex items-center justify-center text-muted-foreground">
                        <div className="text-center space-y-2">
                          <AlertCircle className="w-12 h-12 mx-auto" />
                          <p className="text-sm">Não foi possível carregar o tutorial</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={iosGif}
                        alt="Tutorial de instalação iOS mostrando como adicionar à tela de início"
                        className="w-full"
                        loading="eager"
                        onLoad={() => setGifLoaded(true)}
                        onError={() => {
                          console.error('Erro ao carregar GIF do iOS');
                          setGifError(true);
                        }}
                        style={{ display: gifLoaded ? 'block' : 'none' }}
                      />
                    )}
                  </div>

                  <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                    <p className="font-medium">Siga os passos:</p>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                        <span>Toque no botão <Share2 className="inline w-4 h-4 mx-1" /> <strong>Compartilhar</strong> (na barra inferior)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                        <span>Role a lista para baixo e selecione <strong>"Adicionar à Tela de Início"</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                        <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                      </li>
                    </ol>
                  </div>

                  {user && !rewardProcessed && (
                    <Button
                      onClick={handleIOSInstallationConfirm}
                      size="lg"
                      className="w-full gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      ✅ Instalei o App! (Ganhe 50 XP)
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Android - Botão de instalação com 1 clique */}
        {isAndroid && !isInstalled && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-bold font-heading text-center">
                Instalar no Android
              </h2>

              {canInstallPWA && isInstallable && (
                <Button
                  onClick={handleInstall}
                  size="lg"
                  className="w-full gap-2"
                  disabled={installing}
                >
                  <Download className="w-5 h-5" />
                  {installing ? 'Instalando...' : 'Instalar Agora'}
                </Button>
              )}

              {canInstallPWA && !isInstallable && !waitingForPrompt && (
                <div className="space-y-3">
                  <Button
                    onClick={handleInstall}
                    size="lg"
                    className="w-full gap-2"
                    disabled={installing}
                  >
                    <Download className="w-5 h-5" />
                    Instalar App
                  </Button>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">Ou instale manualmente:</p>
                    <div className="flex items-start gap-2">
                      <Chrome className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Toque no menu <strong>⋮</strong> (três pontos) e selecione <strong>"Instalar app"</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {waitingForPrompt && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <p className="text-sm text-muted-foreground">Preparando instalação...</p>
                </div>
              )}

              <div className="space-y-2 text-sm text-muted-foreground bg-accent/30 rounded-lg p-4">
                <p className="font-medium text-foreground">✨ Benefícios:</p>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Acesso rápido sem abrir navegador
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Funciona offline
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Notificações de novos ebooks
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Desktop - Instruções detalhadas por navegador */}
        {!isIOS && !isAndroid && !isInstalled && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <Monitor className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold font-heading">
                  Instalar no Computador
                </h2>
              </div>

              {isInstallable ? (
                <>
                  <Button
                    onClick={handleInstall}
                    size="lg"
                    className="w-full gap-2"
                    disabled={installing}
                  >
                    <Download className="w-5 h-5" />
                    {installing ? 'Instalando...' : 'Instalar App'}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>
                </>
              ) : null}

              {/* Instruções Chrome/Edge */}
              {(isChrome || canInstallPWA) && (
                <div className="bg-muted/50 rounded-lg p-5 space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Chrome className="w-5 h-5 text-primary" />
                    <span>Como instalar no Chrome/Edge:</span>
                  </div>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                      <span>Procure o ícone de instalação <Download className="inline w-4 h-4 mx-1" /> no canto direito da barra de endereço</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                      <span>Clique no ícone e depois em <strong>"Instalar"</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                      <span>O app será aberto em uma janela separada, sem a barra do navegador</span>
                    </li>
                  </ol>

                  <div className="bg-accent/30 border border-accent-foreground/20 rounded-lg p-3 mt-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Dica:</strong> Você também pode clicar nos três pontos <span className="font-mono">⋮</span> do menu → <strong>"Instalar Despertar da Mulher"</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Como saber se instalou */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <p className="font-medium text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Como saber se instalou com sucesso?
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 pl-6">
                  <li>• O app abre em janela separada (sem barra de navegador)</li>
                  <li>• Você pode fixar o app na barra de tarefas</li>
                  <li>• O ícone do Despertar da Mulher aparece no menu iniciar/aplicativos</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* App já instalado - Orientações para Android/iOS */}
        {isInstalled && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-bold font-heading text-primary">
                  🎉 App Instalado com Sucesso!
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Agora siga estes passos para começar:
                </p>
              </div>

              <Card className="bg-accent/20 border-accent/30">
                <CardContent className="p-5 space-y-4">
                  <ol className="space-y-3 text-left text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                      <div className="flex-1 pt-1">
                        <strong className="text-base">Feche este navegador</strong>
                        <p className="text-muted-foreground mt-1">Você não precisa mais dele agora</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                      <div className="flex-1 pt-1">
                        <strong className="text-base">Abra o app "Despertar da Mulher"</strong>
                        <p className="text-muted-foreground mt-1">Procure o ícone na sua tela inicial ou menu de aplicativos</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                      <div className="flex-1 pt-1">
                        <strong className="text-base">Crie sua conta ou faça login</strong>
                        <p className="text-muted-foreground mt-1">Dentro do app, você terá acesso a todos os seus ebooks</p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">👆 Dica:</strong> O app funciona offline e você receberá notificações de novos ebooks!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Install;
