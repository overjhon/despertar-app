import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { emailSchema } from '@/lib/validation';
import { serverRateLimiter } from '@/lib/serverRateLimiter';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      toast({
        title: "Erro",
        description: emailValidation.error.errors[0].message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Server-side rate limiting
    const rateLimitCheck = await serverRateLimiter.check('passwordReset', emailValidation.data);
    if (rateLimitCheck.blocked) {
      const timeStr = serverRateLimiter.formatRemainingTime(rateLimitCheck.remaining_seconds || 0);
      toast({
        title: "Muitas tentativas",
        description: `Aguarde ${timeStr} antes de tentar novamente.`,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await resetPassword(emailValidation.data);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive",
      });
    } else {
      await serverRateLimiter.reset('passwordReset', emailValidation.data);
      setSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-lg animate-scale-in">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-md">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
          <CardDescription>
            {sent 
              ? 'Email enviado! Verifique sua caixa de entrada.' 
              : 'Digite seu email para receber instruções de recuperação'
            }
          </CardDescription>
        </CardHeader>
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
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
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="premium"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar instruções'}
              </Button>
              <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </Link>
            </CardFooter>
          </form>
        ) : (
          <CardFooter>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;