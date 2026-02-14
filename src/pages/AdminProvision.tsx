import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Rocket, 
  Github, 
  Database, 
  Package, 
  Settings, 
  Key,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { dispatchWorkflow, listRecentRuns, type WorkflowRun } from '@/lib/githubActions';
import { applyEnvironmentVariables } from '@/lib/vercel';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'admin@example.com';

interface ProvisionConfig {
  // GitHub
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubRef: string;
  
  // Supabase Target
  targetSupabaseRef: string;
  targetSupabaseUrl: string;
  targetSupabaseAnonKey: string;
  
  // Vercel
  vercelToken: string;
  vercelProjectId: string;
  vercelTeamId?: string;
  
  // Branding
  brandName: string;
  brandDescription: string;
  brandLogoUrl: string;
  
  // License
  licenseKey: string;
  allowedDomains: string[];
  
  // Automation
  autoSeed: boolean;
  autoBuild: boolean;
}

export default function AdminProvision() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Partial<ProvisionConfig>>({
    githubRef: 'main',
    autoSeed: true,
    autoBuild: true,
    allowedDomains: [],
  });
  
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
  const [provisioningStep, setProvisioningStep] = useState<string>('');

  useEffect(() => {
    if (user && config.githubToken && config.githubOwner && config.githubRepo) {
      loadRecentRuns();
    }
  }, [user, config.githubToken, config.githubOwner, config.githubRepo]);

  if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
    return <Navigate to="/library" replace />;
  }

  const loadRecentRuns = async () => {
    if (!config.githubToken || !config.githubOwner || !config.githubRepo) return;
    
    const { runs } = await listRecentRuns(
      config.githubToken,
      config.githubOwner,
      config.githubRepo,
      'supabase-replicate.yml',
      5
    );
    setRecentRuns(runs);
  };

  const handleStartProvisioning = async () => {
    // Validações
    if (!config.githubToken || !config.githubOwner || !config.githubRepo) {
      toast({
        title: 'Erro',
        description: 'Configure o GitHub primeiro',
        variant: 'destructive',
      });
      return;
    }

    if (!config.targetSupabaseRef || !config.targetSupabaseUrl) {
      toast({
        title: 'Erro',
        description: 'Configure o Supabase target',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Passo 1: Disparar workflow de replicação
      setProvisioningStep('Replicando banco de dados...');
      
      const replicateResult = await dispatchWorkflow(config.githubToken, {
        owner: config.githubOwner,
        repo: config.githubRepo,
        workflow_id: 'supabase-replicate.yml',
        ref: config.githubRef || 'main',
        inputs: {
          target_ref: config.targetSupabaseRef,
          target_url: config.targetSupabaseUrl,
        },
      });

      if (!replicateResult.success) {
        throw new Error(replicateResult.error);
      }

      toast({
        title: '✅ Replicação iniciada',
        description: 'Aguarde a conclusão do workflow',
      });

      // Aguardar alguns segundos para o workflow começar
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Passo 2: Seed (se habilitado)
      if (config.autoSeed) {
        setProvisioningStep('Populando dados iniciais...');
        
        const seedResult = await dispatchWorkflow(config.githubToken, {
          owner: config.githubOwner,
          repo: config.githubRepo,
          workflow_id: 'supabase-seed.yml',
          ref: config.githubRef || 'main',
          inputs: {
            target_db_url: config.targetSupabaseUrl,
            tables: 'public.ebooks,public.badges',
          },
        });

        if (!seedResult.success) {
          console.warn('Seed workflow failed:', seedResult.error);
        }
      }

      // Passo 3: Aplicar variáveis de ambiente no Vercel (se configurado)
      if (config.vercelToken && config.vercelProjectId && config.brandName) {
        setProvisioningStep('Configurando Vercel...');
        
        const envVars = [
          { key: 'VITE_BRAND_NAME', value: config.brandName },
          { key: 'VITE_DEFAULT_DESCRIPTION', value: config.brandDescription || '' },
          { key: 'VITE_SUPABASE_URL', value: config.targetSupabaseUrl },
          { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: config.targetSupabaseAnonKey || '' },
        ];

        const vercelResult = await applyEnvironmentVariables(
          config.vercelToken,
          config.vercelProjectId,
          envVars,
          config.vercelTeamId
        );

        if (!vercelResult.success) {
          console.warn('Some Vercel env vars failed:', vercelResult.results);
        } else {
          toast({
            title: '✅ Variáveis Vercel aplicadas',
          });
        }
      }

      // Passo 4: Criar licença (se configurado)
      if (config.licenseKey && config.allowedDomains && config.allowedDomains.length > 0) {
        setProvisioningStep('Criando licença...');
        
        const { error: licenseError } = await supabase
          .from('licenses')
          .insert({
            license_key: config.licenseKey,
            owner_email: user?.email || '',
            allowed_domains: config.allowedDomains,
            status: 'active',
          });

        if (licenseError) {
          console.warn('License creation failed:', licenseError);
        } else {
          toast({
            title: '✅ Licença criada',
          });
        }
      }

      // Passo 5: Build (se habilitado)
      if (config.autoBuild && config.githubToken) {
        setProvisioningStep('Disparando build...');
        
        const buildResult = await dispatchWorkflow(config.githubToken, {
          owner: config.githubOwner,
          repo: config.githubRepo,
          workflow_id: 'build-and-upload.yml',
          ref: config.githubRef || 'main',
          inputs: {
            brand_name: config.brandName || '',
          },
        });

        if (!buildResult.success) {
          console.warn('Build workflow failed:', buildResult.error);
        }
      }

      setProvisioningStep('Provisionamento concluído!');
      
      toast({
        title: '🎉 Provisionamento iniciado',
        description: 'Acompanhe o progresso nas execuções recentes',
      });

      // Recarregar runs
      await loadRecentRuns();
      
    } catch (error: any) {
      toast({
        title: 'Erro no provisionamento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setProvisioningStep('');
    }
  };

  const getRunStatusBadge = (run: WorkflowRun) => {
    if (run.status === 'completed') {
      if (run.conclusion === 'success') {
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Success</Badge>;
      } else {
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> {run.conclusion}</Badge>;
      }
    } else if (run.status === 'in_progress') {
      return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Queued</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Rocket className="h-8 w-8" />
          Provisionamento Whitelabel 1-Click
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure e provisione novos clientes de forma automatizada
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="provision">
            <Rocket className="h-4 w-4 mr-2" />
            Provisionar
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          {/* GitHub Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>GitHub Token</Label>
                  <Input
                    type="password"
                    value={config.githubToken || ''}
                    onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
                    placeholder="ghp_..."
                  />
                </div>
                <div>
                  <Label>Owner</Label>
                  <Input
                    value={config.githubOwner || ''}
                    onChange={(e) => setConfig({ ...config, githubOwner: e.target.value })}
                    placeholder="mycompany"
                  />
                </div>
                <div>
                  <Label>Repository</Label>
                  <Input
                    value={config.githubRepo || ''}
                    onChange={(e) => setConfig({ ...config, githubRepo: e.target.value })}
                    placeholder="whitelabel-ebook"
                  />
                </div>
                <div>
                  <Label>Branch</Label>
                  <Input
                    value={config.githubRef || ''}
                    onChange={(e) => setConfig({ ...config, githubRef: e.target.value })}
                    placeholder="main"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supabase Target Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Supabase Target Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Project Ref</Label>
                  <Input
                    value={config.targetSupabaseRef || ''}
                    onChange={(e) => setConfig({ ...config, targetSupabaseRef: e.target.value })}
                    placeholder="abcdefghij"
                  />
                </div>
                <div>
                  <Label>Project URL</Label>
                  <Input
                    value={config.targetSupabaseUrl || ''}
                    onChange={(e) => setConfig({ ...config, targetSupabaseUrl: e.target.value })}
                    placeholder="https://xyz.supabase.co"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Anon Key</Label>
                  <Input
                    type="password"
                    value={config.targetSupabaseAnonKey || ''}
                    onChange={(e) => setConfig({ ...config, targetSupabaseAnonKey: e.target.value })}
                    placeholder="eyJ..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vercel Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Vercel Configuration (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Vercel Token</Label>
                  <Input
                    type="password"
                    value={config.vercelToken || ''}
                    onChange={(e) => setConfig({ ...config, vercelToken: e.target.value })}
                    placeholder="token..."
                  />
                </div>
                <div>
                  <Label>Project ID</Label>
                  <Input
                    value={config.vercelProjectId || ''}
                    onChange={(e) => setConfig({ ...config, vercelProjectId: e.target.value })}
                    placeholder="prj_..."
                  />
                </div>
                <div>
                  <Label>Team ID (Optional)</Label>
                  <Input
                    value={config.vercelTeamId || ''}
                    onChange={(e) => setConfig({ ...config, vercelTeamId: e.target.value })}
                    placeholder="team_..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Brand Name</Label>
                  <Input
                    value={config.brandName || ''}
                    onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                    placeholder="My Ebook Platform"
                  />
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={config.brandLogoUrl || ''}
                    onChange={(e) => setConfig({ ...config, brandLogoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={config.brandDescription || ''}
                    onChange={(e) => setConfig({ ...config, brandDescription: e.target.value })}
                    placeholder="Plataforma de ebooks..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                License Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>License Key</Label>
                <Input
                  value={config.licenseKey || ''}
                  onChange={(e) => setConfig({ ...config, licenseKey: e.target.value })}
                  placeholder="WHITELABEL-XXXX-XXXX-XXXX"
                />
              </div>
              <div>
                <Label>Allowed Domains (one per line)</Label>
                <Textarea
                  value={(config.allowedDomains || []).join('\n')}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    allowedDomains: e.target.value.split('\n').filter(d => d.trim()) 
                  })}
                  placeholder="example.com&#10;subdomain.example.com"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provision" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Iniciar Provisionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Seed Database</p>
                    <p className="text-sm text-muted-foreground">Popular badges e ebooks de exemplo</p>
                  </div>
                  <Switch
                    checked={config.autoSeed}
                    onCheckedChange={(checked) => setConfig({ ...config, autoSeed: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Build Frontend</p>
                    <p className="text-sm text-muted-foreground">Disparar build do frontend automaticamente</p>
                  </div>
                  <Switch
                    checked={config.autoBuild}
                    onCheckedChange={(checked) => setConfig({ ...config, autoBuild: checked })}
                  />
                </div>
              </div>

              {provisioningStep && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {provisioningStep}
                  </p>
                </div>
              )}

              <Button
                onClick={handleStartProvisioning}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Provisionando...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Iniciar Provisionamento 1-Click
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execuções Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentRuns.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma execução recente
                  </p>
                ) : (
                  recentRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{run.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(run.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRunStatusBadge(run)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(run.html_url, '_blank')}
                        >
                          Ver
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
