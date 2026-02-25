import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoSemFundo from '@/assets/logo-sem-fundo.png';
import { BRAND_NAME, DEFAULT_DESCRIPTION } from '@/config/brand';
import { PageSEO } from '@/components/seo/PageSEO';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isInstalled } = useInstallPrompt();

  useEffect(() => {
    // Check if coming from purchase
    const isNewUser = searchParams.get("newuser") === "true";

    if (!loading && user) {
      navigate('/library');
    } else if (!loading && isNewUser) {
      // Redirect new purchasers to onboarding
      navigate('/onboarding');
    }
  }, [user, loading, navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <BookOpen className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={`${BRAND_NAME} - Sua Jornada de Despertar`}
        description={DEFAULT_DESCRIPTION}
        path="/"
      />
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-2xl w-full text-center">
          {/* Logo */}
          <div className="mb-10 flex justify-center">
            <img
              src={logoSemFundo}
              alt={`${BRAND_NAME}`}
              width="320"
              height="384"
              loading="eager"
              decoding="async"
              className="w-64 md:w-80 h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)] hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Title */}
          <div className="mb-10 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-white/90 animate-pulse" />
              <h2 className="text-xl md:text-2xl text-white/95 font-medium">
                Desperte seu potencial com ebooks exclusivos
              </h2>
              <Sparkles className="w-6 h-6 text-white/90 animate-pulse" />
            </div>
            <p className="text-base md:text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
              Acesse receitas exclusivas, técnicas profissionais e transforme sua paixão em negócio
            </p>
          </div>

          {/* Explicação do fluxo */}
          <div className="text-center mb-6">
            <p className="text-lg sm:text-xl text-white/95 font-semibold flex items-center justify-center gap-2 drop-shadow-lg">
              <span className="text-2xl">🎉</span>
              {isInstalled
                ? "Bem-vindo! Crie sua conta para começar"
                : "Instale o app para acessar ebooks offline e ganhar recompensas"
              }
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 mb-6">
            {!isInstalled ? (
              <>
                {/* Instalar App - CTA Principal (apenas se não instalado) */}
                <Link to="/instalar" className="w-full sm:w-auto relative">
                  <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1.5 rounded-full animate-pulse shadow-xl z-10 border-2 border-white">
                    COMECE AQUI
                  </div>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto min-w-[280px] bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-[0_12px_40px_rgba(0,0,0,0.3)] font-bold text-xl h-16 px-14 rounded-2xl"
                  >
                    Instalar App
                  </Button>
                </Link>

                {/* Separador "ou" */}
                <div className="flex items-center gap-3 w-full max-w-[280px]">
                  <div className="h-px flex-1 bg-white/30"></div>
                  <span className="text-white/70 text-sm font-medium">ou</span>
                  <div className="h-px flex-1 bg-white/30"></div>
                </div>

                {/* Login - Ação Secundária */}
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full sm:w-auto min-w-[240px] border-2 border-white/40 bg-transparent text-white hover:bg-white/15 hover:scale-105 transition-all font-medium text-base h-12 px-10 rounded-xl backdrop-blur-sm"
                  >
                    Já tenho conta
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Criar Conta - CTA Principal (quando instalado) */}
                <Link to="/onboarding" className="w-full sm:w-auto relative">
                  <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1.5 rounded-full animate-pulse shadow-xl z-10 border-2 border-white">
                    COMECE AQUI
                  </div>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto min-w-[280px] bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-[0_12px_40px_rgba(0,0,0,0.3)] font-bold text-xl h-16 px-14 rounded-2xl"
                  >
                    Criar Conta
                  </Button>
                </Link>

                {/* Separador "ou" */}
                <div className="flex items-center gap-3 w-full max-w-[280px]">
                  <div className="h-px flex-1 bg-white/30"></div>
                  <span className="text-white/70 text-sm font-medium">ou</span>
                  <div className="h-px flex-1 bg-white/30"></div>
                </div>

                {/* Fazer Login - Ação Secundária */}
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full sm:w-auto min-w-[240px] border-2 border-white/40 bg-transparent text-white hover:bg-white/15 hover:scale-105 transition-all font-medium text-base h-12 px-10 rounded-xl backdrop-blur-sm"
                  >
                    Fazer Login
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="text-white/80 text-sm space-y-2">
            <p className="drop-shadow-md flex items-center justify-center gap-2">
              <span className="text-lg">✨</span>
              Milhares de mulheres já estão despertando
            </p>
            <p className="drop-shadow-md flex items-center justify-center gap-2">
              <span className="text-lg">🔐</span>
              Acesso seguro e ilimitado aos seus ebooks
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
