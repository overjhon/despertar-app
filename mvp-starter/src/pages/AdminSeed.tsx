import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PageSEO } from '@/components/seo/PageSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SeedResult {
  success: boolean;
  data?: {
    users_created: number;
    ebooks_referenced: number;
    posts_created: number;
    message: string;
    note: string;
  };
  error?: string;
}

export default function AdminSeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userCount, setUserCount] = useState(20);
  const [cleanOldData, setCleanOldData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressPhase, setProgressPhase] = useState('');
  const [result, setResult] = useState<SeedResult | null>(null);
  const [hasAdminRole, setHasAdminRole] = useState<boolean | null>(null);

  // Check admin role
  useState(() => {
    if (user) {
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle()
        .then(({ data }) => {
          setHasAdminRole(!!data);
        });
    }
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (hasAdminRole === false) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (hasAdminRole === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSeed = async () => {
    if (userCount < 5 || userCount > 50) {
      toast({
        title: 'Valor inválido',
        description: 'O número de usuários deve estar entre 5 e 50',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setProgressPhase('Iniciando...');
    setResult(null);

    try {
      // Simular progresso com fases
      const phases = [
        { percent: 15, text: 'Criando usuários...' },
        { percent: 30, text: 'Gerando gamificação...' },
        { percent: 45, text: 'Criando depoimentos...' },
        { percent: 60, text: 'Gerando posts...' },
        { percent: 75, text: 'Adicionando engajamento...' },
        { percent: 90, text: 'Finalizando...' },
      ];

      let currentPhase = 0;
      const progressInterval = setInterval(() => {
        if (currentPhase < phases.length) {
          setProgress(phases[currentPhase].percent);
          setProgressPhase(phases[currentPhase].text);
          currentPhase++;
        }
      }, 2000);

      const { data, error } = await supabase.functions.invoke('seed-database', {
        body: { userCount, cleanOldData },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setProgressPhase('Concluído!');

      if (error) throw error;

      setResult({ success: true, data });
      toast({
        title: 'Seed concluído com sucesso!',
        description: `${data.data?.users_created || userCount} usuários criados com conteúdo realista`,
      });
    } catch (error) {
      console.error('Seed error:', error);
      setProgressPhase('Erro!');
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      toast({
        title: 'Erro ao executar seed',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageSEO
        title="Admin - Seed Database"
        description="Populate database with demo data"
      />
      
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Seed Database</h1>
          <p className="text-muted-foreground">
            Popular o banco de dados com dados de demonstração realistas
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuração do Seed
              </CardTitle>
              <CardDescription>
                Gere usuários, posts, depoimentos e interações automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userCount">Número de Usuários</Label>
                <Input
                  id="userCount"
                  type="number"
                  min={5}
                  max={50}
                  value={userCount}
                  onChange={(e) => setUserCount(parseInt(e.target.value))}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  Entre 5 e 50 usuários (recomendado: 10-20)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cleanOldData"
                  checked={cleanOldData}
                  onCheckedChange={(checked) => setCleanOldData(checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="cleanOldData" className="text-sm font-normal cursor-pointer">
                  🗑️ Limpar todos os seeds antigos antes de gerar novos
                </Label>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⚠️ Atenção:</strong> A limpeza remove TODOS os usuários de teste (@example.com) 
                  e seus dados, mas preserva usuários reais.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>🤖 O que será criado com IA da OpenAI:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{userCount} perfis com <strong>fotos realistas</strong> e bios</li>
                    <li>Depoimentos <strong>100% contextualizados</strong> aos livros</li>
                    <li>Posts da comunidade <strong>autênticos e específicos</strong></li>
                    <li>Comentários que <strong>respondem aos posts</strong></li>
                    <li>Dados de gamificação (XP, níveis, streaks)</li>
                    <li><strong>30 dias de histórico</strong> para rankings funcionais</li>
                    <li>Criações da comunidade com imagens</li>
                  </ul>
                  <p className="mt-2 text-sm">
                    <strong>Senha padrão:</strong> demo123456
                  </p>
                </AlertDescription>
              </Alert>

              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{progressPhase}</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <Button
                onClick={handleSeed}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Dados...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Executar Seed
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {result.success ? 'Seed Concluído!' : 'Erro no Seed'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.success && result.data ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Usuários Criados</p>
                        <p className="text-2xl font-bold">{result.data.users_created}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Posts Criados</p>
                        <p className="text-2xl font-bold">{result.data.posts_created}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Ebooks Referenciados</p>
                        <p className="text-2xl font-bold">{result.data.ebooks_referenced}</p>
                      </div>
                    </div>
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        {result.data.message}
                        <br />
                        <strong className="mt-2 block">{result.data.note}</strong>
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
