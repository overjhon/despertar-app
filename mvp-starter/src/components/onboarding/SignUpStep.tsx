import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Lock } from "lucide-react";
import { fullNameSchema, emailSchema, passwordSchema } from "@/lib/validation";
import { serverRateLimiter } from "@/lib/serverRateLimiter";

interface SignUpStepProps {
  onComplete: () => void;
}

export const SignUpStep = ({ onComplete }: SignUpStepProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    try {
      fullNameSchema.parse(fullName);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (validationError: any) {
      setError(validationError.errors?.[0]?.message || "Dados inválidos");
      return;
    }

    // Rate limiting
    const rateLimitResult = await serverRateLimiter.check("signup", email);
    if (!rateLimitResult.allowed) {
      const timeMsg = rateLimitResult.remaining_seconds 
        ? serverRateLimiter.formatRemainingTime(rateLimitResult.remaining_seconds)
        : "um momento";
      setError(`Muitas tentativas. Aguarde ${timeMsg}.`);
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(email, password, fullName);

      if (signUpError) {
        if (signUpError.message?.includes("already registered")) {
          setError("Este email já está cadastrado");
        } else {
          setError(signUpError.message || "Erro ao criar conta");
        }
        return;
      }

      await serverRateLimiter.reset("signup", email);
      onComplete();
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Criar Sua Conta</h2>
        <p className="text-muted-foreground">
          Seu acesso aos ebooks exclusivos está quase pronto!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome Completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              placeholder="Maria Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar Conta e Continuar →"
          )}
        </Button>
      </form>
    </div>
  );
};
