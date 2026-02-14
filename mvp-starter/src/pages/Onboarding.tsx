import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageSEO } from "@/components/seo/PageSEO";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { SignUpStep } from "@/components/onboarding/SignUpStep";
import { CelebrationScreen } from "@/components/onboarding/CelebrationScreen";
import { BRAND_NAME, DEFAULT_DESCRIPTION } from '@/config/brand';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Verificar se está no app instalado (standalone mode)
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Se não está no app instalado, redirecionar para /instalar
    if (!isStandalone && !isIOSStandalone) {
      navigate('/instalar');
    }
  }, [navigate]);

  useEffect(() => {
    // Se já estiver logado, pular para step 2 (celebration)
    if (user && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [user, currentStep]);

  const handleSignUpComplete = () => {
    setCurrentStep(2); // Ir direto para celebration
  };

  return (
    <>
      <PageSEO
        title={`Bem-vindo ao ${BRAND_NAME} - Configure sua Conta`}
        description={DEFAULT_DESCRIPTION}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/logo-optimized.webp"
              alt={BRAND_NAME}
              className="h-16 mx-auto"
            />
          </div>

          {/* Progress */}
          {currentStep < 2 && (
            <StepProgress currentStep={currentStep} totalSteps={2} />
          )}

          {/* Steps */}
          <div className="mt-8">
            {currentStep === 1 && (
              <SignUpStep onComplete={handleSignUpComplete} />
            )}
            
            {currentStep === 2 && (
              <CelebrationScreen />
            )}
          </div>

          {/* Help Link */}
          {currentStep < 2 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Já tem conta? Fazer login
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
