import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Zap, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useXP } from "@/hooks/useXP";
import confetti from "canvas-confetti";

export const CelebrationScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addXP } = useXP();
  const [rewarded, setRewarded] = useState(false);
  const [countdown, setCountdown] = useState(2);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Maker";

  useEffect(() => {
    // Confetti - explosão única e rápida
    const colors = ["#8B5CF6", "#EC4899", "#F59E0B"];

    // Explosão do centro
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    });

    // Mini explosões laterais (sutil)
    setTimeout(() => {
      confetti({
        particleCount: 15,
        angle: 60,
        spread: 40,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 15,
        angle: 120,
        spread: 40,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });
    }, 150);

    // Award rewards
    const rewardUser = async () => {
      if (!rewarded && user) {
        try {
          await addXP({
            amount: 100,
            reason: "onboarding_complete",
          });

          setRewarded(true);
        } catch (error) {
          console.error("Error awarding rewards:", error);
        }
      }
    };

    rewardUser();
  }, [user, rewarded, addXP]);

  useEffect(() => {
    console.log('[Onboarding] Countdown iniciado:', countdown);

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        console.log('[Onboarding] Countdown:', prev);
        if (prev <= 1) {
          clearInterval(timer);
          console.log('[Onboarding] Redirecionando para /library');
          navigate("/library");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center mx-auto animate-scale-in">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          Tudo Pronto, {firstName}! 🎉
        </h2>
        <p className="text-muted-foreground text-lg">
          Sua jornada de despertar começa agora
        </p>
      </div>

      {/* Rewards */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">+100 XP Ganhos! 🎁</p>
            <p className="text-sm text-muted-foreground">Bônus de boas-vindas</p>
          </div>
        </div>
      </Card>

      {/* CTA */}
      <div className="space-y-3">
        <Button
          onClick={() => navigate("/library")}
          size="lg"
          className="w-full"
        >
          <BookOpen className="mr-2 h-5 w-5" />
          Ir para Meus Ebooks
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Redirecionando em {countdown}s...
        </p>
      </div>
    </div>
  );
};
