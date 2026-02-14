import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ServerCog, Eye, EyeOff } from 'lucide-react';
import { checkSupabaseClientHealth, checkPostgrestHealth } from '@/lib/dbHealth';
import { logSupabaseConnectionDoc } from '@/lib/dbConfigDoc';

const ADMIN_EMAIL = 'suporte@magoautomacoes.com.br';

export default function AdminSettings() {
  const { user, loading: authLoading } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [clientHealth, setClientHealth] = useState<any>(null);
  const [restHealth, setRestHealth] = useState<any>(null);

  const supabaseUrl = useMemo(() => import.meta.env.VITE_SUPABASE_URL || '', []);
  const supabaseAnon = useMemo(() => import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '', []);

  useEffect(() => {
    logSupabaseConnectionDoc('admin_settings_visit', {
      context: { user_email: user?.email ?? null },
    });
  }, [user?.email]);

  if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
    return <Navigate to="/library" replace />;
  }

  const testClient = async () => {
    const res = await checkSupabaseClientHealth();
    setClientHealth(res);
    if (!res.ok) {
      logSupabaseConnectionDoc('client_health_fail', { error: res.error, context: res });
    }
  };

  const testRest = async () => {
    const res = await checkPostgrestHealth();
    setRestHealth(res);
    if (!res.ok) {
      logSupabaseConnectionDoc('postgrest_health_fail', { error: res.error, context: res });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Admin Settings (MCP)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Supabase URL</Label>
              <Input value={supabaseUrl} readOnly />
            </div>
            <div>
              <Label>Publishable Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={supabaseAnon}
                  readOnly
                />
                <Button variant="outline" onClick={() => setShowKey(v => !v)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={testClient}>
              <ServerCog className="h-4 w-4 mr-2" /> Testar Supabase Client
            </Button>
            <Button onClick={testRest} variant="secondary">
              <ServerCog className="h-4 w-4 mr-2" /> Testar PostgREST
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <h3 className="font-semibold mb-2">Supabase Client</h3>
              <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(clientHealth, null, 2)}</pre>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-semibold mb-2">PostgREST</h3>
              <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(restHealth, null, 2)}</pre>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Acesso restrito ao admin ({ADMIN_EMAIL}). Valores sensíveis permanecem mascarados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}