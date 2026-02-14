import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { logAdminEvent } from '@/lib/adminAudit';

const AdminPush = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('announcement');
  const [role, setRole] = useState<'any'|'admin'|'user'>('any');
  const [minLevel, setMinLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(7);
  const [streakMin, setStreakMin] = useState(0);
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [audienceCount, setAudienceCount] = useState<number>(0);

  const canUse = useMemo(() => !!user, [user]);

  useEffect(() => {
    const calcAudience = async () => {
      if (!user) return;
      try {
        const { data: targets } = await supabase
          .from('user_gamification')
          .select('user_id, current_level, current_streak_days')
          .gte('current_level', minLevel)
          .lte('current_level', maxLevel)
          .gte('current_streak_days', streakMin);

        let ids = (targets || []).map(t => t.user_id);

        if (role !== 'any') {
          const { data: roleUsers } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', role);
          const roleSet = new Set((roleUsers || []).map(r => r.user_id));
          ids = ids.filter(id => roleSet.has(id));
        }

        setAudienceCount(ids.length);
      } catch (e) {
        setAudienceCount(0);
      }
    };
    calcAudience();
  }, [user, minLevel, maxLevel, streakMin, role]);

  const handleSend = async () => {
    if (!user) return;
    if (!title || !message) {
      toast({ title: 'Dados incompletos', description: 'Título e mensagem são obrigatórios' });
      return;
    }
    setLoading(true);
    try {
      // Edge Function preferida (FCM); fallback para notificação interna
      let ok = false;
      try {
        const payload = {
          title, message, link, type,
          filters: { role, minLevel, maxLevel, streakMin },
          dryRun,
        };
        const res = await fetch('/functions/v1/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        ok = res.ok;
      } catch {}

      if (!ok) {
        // Fallback: criar notificações in-app para audiência
        const { data: targets } = await supabase
          .from('user_gamification')
          .select('user_id, current_level, current_streak_days')
          .gte('current_level', minLevel)
          .lte('current_level', maxLevel)
          .gte('current_streak_days', streakMin);

        let ids = (targets || []).map(t => t.user_id);
        if (role !== 'any') {
          const { data: roleUsers } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', role);
          const roleSet = new Set((roleUsers || []).map(r => r.user_id));
          ids = ids.filter(id => roleSet.has(id));
        }

        for (const id of ids) {
          await supabase.rpc('create_notification', {
            p_user_id: id,
            p_type: type,
            p_title: title,
            p_message: message,
            p_link: link || null,
          });
        }
      }

      await logAdminEvent('admin_push_sent', {
        title, type, role, minLevel, maxLevel, streakMin, dryRun,
        audience_count: audienceCount,
      });
      toast({ title: 'Notificações enviadas', description: `Audiência: ${audienceCount}` });
    } catch (e) {
      toast({ title: 'Falha ao enviar', description: String(e) });
    } finally {
      setLoading(false);
    }
  };

  if (!canUse) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Admin · Push Notifications</h1>
          <p className="text-sm text-muted-foreground">Envie alertas para a base de usuários com segmentação</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Mensagem" value={message} onChange={e => setMessage(e.target.value)} />
              <Input placeholder="Link opcional (/library, /challenges, etc.)" value={link} onChange={e => setLink(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={type} onValueChange={(v) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">announcement</SelectItem>
                    <SelectItem value="challenge">challenge</SelectItem>
                    <SelectItem value="level_up">level_up</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="moderator">moderator</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" min={1} max={7} value={minLevel} onChange={e => setMinLevel(Number(e.target.value))} />
                <Input type="number" min={1} max={7} value={maxLevel} onChange={e => setMaxLevel(Number(e.target.value))} />
                <Input type="number" min={0} value={streakMin} onChange={e => setStreakMin(Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Dry-run (somente testar envio pela função)</span>
                <Button variant={dryRun ? 'secondary' : 'outline'} size="sm" onClick={() => setDryRun(!dryRun)}>
                  {dryRun ? 'Ativo' : 'Desativado'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Audiência estimada: {audienceCount}</span>
                <Button onClick={handleSend} disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Notificações'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPush;