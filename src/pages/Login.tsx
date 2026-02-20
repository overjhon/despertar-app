import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { emailSchema, passwordSchema } from '@/lib/validation';
import logo from '@/assets/logo.png';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { NotificationPrompt } from '@/components/pwa/NotificationPrompt';
import { serverRateLimiter } from '@/lib/serverRateLimiter';
import { toast } from 'sonner';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const { signIn, user } = useAuth();
  const { requestPermission } = usePushNotifications(user?.id);

  // Show notification prompt after successful login
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      // Delay to not overwhelm user
      const timer = setTimeout(() => setShowNotifPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setError(emailValidation.error.errors[0].message);
      setLoading(false);
      return;
    }

    // Validate password
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setError(passwordValidation.error.errors[0].message);
      setLoading(false);
      return;
    }

    // Server-side rate limiting check
    const rateLimitCheck = await serverRateLimiter.check('login', emailValidation.data);
    if (rateLimitCheck.blocked) {
      const timeStr = serverRateLimiter.formatRemainingTime(rateLimitCheck.remaining_seconds || 0);
      setError(`Muitas tentativas de login. Tente novamente em ${timeStr}.`);
      setLoading(false);
      toast.error('Login bloqueado temporariamente', {
        description: `Aguarde ${timeStr} antes de tentar novamente`,
      });
      return;
    }

    // Show attempts warning
    if (rateLimitCheck.attempts_left !== undefined && rateLimitCheck.attempts_left <= 2) {
      toast.warning(`${rateLimitCheck.attempts_left} tentativas restantes`);
    }

    const { error } = await signIn(emailValidation.data, passwordValidation.data);

    if (error) {
      setError('Email ou senha incorretos. Tente novamente.');
    } else {
      // Reset server-side rate limit on successful login
      await serverRateLimiter.reset('login', emailValidation.data);
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
          <CardTitle className="font-heading text-3xl text-primary">Bem-vinda de volta! 💕</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Que bom ter você aqui novamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Google Login */}
          <SocialLoginButton provider="google" text="Entrar com Google" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou continue com email</span>
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
                  autoComplete="email"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                Esqueceu a senha?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              variant="premium"
              className="w-full h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Não tem uma conta?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <NotificationPrompt
        open={showNotifPrompt}
        onOpenChange={setShowNotifPrompt}
        onEnable={async () => {
          await requestPermission();
          setShowNotifPrompt(false);
        }}
      />
    </div>
  );
};

export default Login;