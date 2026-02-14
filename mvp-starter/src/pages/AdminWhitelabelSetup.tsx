import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const AdminWhitelabelSetup = () => {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [platform, setPlatform] = useState('kiwify');
  const [productId, setProductId] = useState('');
  const [ebookId, setEbookId] = useState('');
  const [mappings, setMappings] = useState<any[]>([]);

  const canUse = useMemo(() => !!user, [user]);

  // NOTA: A tabela app_settings ainda não foi criada no banco
  // Quando criar, descomente as funções abaixo
  const loadSettings = async () => {
    // TODO: Implementar quando app_settings existir
    console.warn('app_settings table not yet implemented');
  };

  const saveSetting = async (key: string, value: any) => {
    // TODO: Implementar quando app_settings existir
    console.warn('app_settings table not yet implemented');
  };

  const loadEbooks = async () => {
    const { data } = await supabase.from('ebooks').select('id,title');
    setEbooks(data || []);
  };

  const loadMappings = async () => {
    const { data } = await supabase.from('product_mappings').select('*');
    setMappings(data || []);
  };

  useEffect(() => {
    if (!user) return;
    loadSettings();
    loadEbooks();
    loadMappings();
  }, [user]);

  const handleSaveWebhook = async () => {
    await saveSetting('n8n_webhook_url', webhookUrl);
    await saveSetting('n8n_webhook_secret', webhookSecret);
    await saveSetting('webhook_enabled', webhookEnabled);
    toast({ title: 'Configurações salvas' });
  };

  const handleTestWebhook = async () => {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'test', status: 'ok' }),
      });
      if (res.ok) toast({ title: 'Webhook OK' });
      else toast({ title: 'Falha no webhook' });
    } catch {
      toast({ title: 'CORS bloqueou o teste' });
    }
  };

  const handleAddMapping = async () => {
    if (!platform || !productId || !ebookId) return;
    const { error } = await supabase
      .from('product_mappings')
      .upsert({ platform, product_id: productId, ebook_id: ebookId }, { onConflict: 'platform,product_id' });
    if (!error) {
      toast({ title: 'Mapeamento salvo' });
      setProductId('');
      setEbookId('');
      loadMappings();
    } else {
      toast({ title: 'Erro ao salvar' });
    }
  };

  const handleUploadCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const rows = [] as any[];
    for (const l of lines.slice(1)) {
      const parts = l.split(',');
      const plat = (parts[0] || '').trim();
      const pid = (parts[1] || '').trim();
      const ebook = (parts[2] || '').trim();
      let eid = ebook;
      if (!/^[0-9a-f-]{36}$/i.test(ebook)) {
        const found = ebooks.find(e => (e.title || '').toLowerCase() === ebook.toLowerCase());
        eid = found?.id || '';
      }
      if (plat && pid && eid) rows.push({ platform: plat, product_id: pid, ebook_id: eid });
    }
    if (rows.length === 0) {
      toast({ title: 'CSV vazio ou inválido' });
      return;
    }
    const { error } = await supabase.from('product_mappings').upsert(rows, { onConflict: 'platform,product_id' });
    if (!error) {
      toast({ title: 'CSV importado' });
      loadMappings();
    } else {
      toast({ title: 'Erro ao importar' });
    }
  };

  if (!canUse) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Admin · Setup Rápido</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="webhook">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="webhook">Webhook n8n</TabsTrigger>
            <TabsTrigger value="mapping">Mapeamentos</TabsTrigger>
            <TabsTrigger value="brand">Marca</TabsTrigger>
          </TabsList>
          <TabsContent value="webhook" className="mt-6">
            <Card className="p-4 space-y-4">
              <Input placeholder="Webhook URL" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
              <Input placeholder="Webhook Secret (opcional)" value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} />
              <div className="flex items-center justify-between">
                <Button variant={webhookEnabled ? 'secondary' : 'outline'} onClick={() => setWebhookEnabled(!webhookEnabled)}>
                  {webhookEnabled ? 'Webhook Ativo' : 'Webhook Inativo'}
                </Button>
                <div className="flex gap-2">
                  <Button onClick={handleSaveWebhook}>Salvar</Button>
                  <Button variant="outline" onClick={handleTestWebhook}>Testar Webhook</Button>
                </div>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="mapping" className="mt-6">
            <Card className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kiwify">kiwify</SelectItem>
                    <SelectItem value="hotmart">hotmart</SelectItem>
                    <SelectItem value="shopify">shopify</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Product ID" value={productId} onChange={e => setProductId(e.target.value)} />
                <Select value={ebookId} onValueChange={setEbookId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ebook" />
                  </SelectTrigger>
                  <SelectContent>
                    {ebooks.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddMapping}>Salvar Mapeamento</Button>
                <Input type="file" accept=".csv" onChange={e => e.target.files && handleUploadCsv(e.target.files[0])} />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <th>Plataforma</th>
                      <th>Product ID</th>
                      <th>Ebook</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map(m => (
                      <tr key={`${m.platform}-${m.product_id}`}>
                        <td>{m.platform}</td>
                        <td>{m.product_id}</td>
                        <td>{ebooks.find(e => e.id === m.ebook_id)?.title || m.ebook_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="brand" className="mt-6">
            <Card className="p-4 space-y-4">
              <Textarea placeholder="Ajuste envs de marca no .env (BRAND_NAME, BASE_URL, DEFAULT_DESCRIPTION) e redeploy" rows={4} readOnly />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast({ title: 'Verifique .env' })}>Validar</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminWhitelabelSetup;