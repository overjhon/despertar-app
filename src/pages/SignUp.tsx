import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { emailSchema, passwordSchema, fullNameSchema } from '@/lib/validation';
import { serverRateLimiter } from '@/lib/serverRateLimiter';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { trackCompleteRegistration } from '@/lib/facebookPixel';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate full name
    const nameValidation = fullNameSchema.safeParse(fullName);
    if (!nameValidation.success) {
      setError(nameValidation.error.errors[0].message);
      return;
    }

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setError(emailValidation.error.errors[0].message);
      return;
    }

    // Validate password
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setError(passwordValidation.error.errors[0].message);
      return;
    }

    // Server-side rate limiting check
    const rateLimitCheck = await serverRateLimiter.check('signup', emailValidation.data);
    if (rateLimitCheck.blocked) {
      const timeStr = serverRateLimiter.formatRemainingTime(rateLimitCheck.remaining_seconds || 0);
      setError(`Muitas tentativas de cadastro. Tente novamente em ${timeStr}.`);
      toast.error('Cadastro bloqueado temporariamente', {
        description: `Aguarde ${timeStr} antes de tentar novamente`,
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(
      emailValidation.data,
      passwordValidation.data,
      nameValidation.data
    );

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado. Faça login.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } else {
      // Reset server-side rate limit on successful signup
      await serverRateLimiter.reset('signup', emailValidation.data);

      // Track successful registration with Meta Pixel
      trackCompleteRegistration();

      // FASE 2.3: Processar código de indicação se existir
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref') || localStorage.getItem('referral_code');

      if (referralCode) {
        // Aguardar um momento para garantir que o usuário foi criado
        setTimeout(async () => {
          try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            if (currentUser) {
              await supabase.functions.invoke('process-referral-reward', {
                body: {
                  action: 'check_conversion',
                  referralCode: referralCode,
                  newUserId: currentUser.id,
                },
              });

              // Limpar código do localStorage
              localStorage.removeItem('referral_code');
            }
          } catch (refError) {
            console.error('Error processing referral:', refError);
            // Não bloqueia o signup se der erro no referral
          }
        }, 1000);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-[0_20px_60px_-15px_rgba(236,91,164,0.3)] animate-scale-in backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <img src={logo} alt="Mundo Delas" className="w-48 h-auto drop-shadow-md" />
          </div>
          <CardTitle className="font-heading text-3xl text-primary">Bem-vinda! 💕</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Crie sua conta e comece sua jornada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Google SignUp */}
          <SocialLoginButton provider="google" text="Criar conta com Google" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou crie com email</span>
            </div>
          </div>
        </CardContent>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-0">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              variant="premium"
              className="w-full h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignUp;