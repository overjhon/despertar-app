import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EditEbookDialog } from '@/components/admin/EditEbookDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { logAdminEvent } from '@/lib/adminAudit';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductMapping {
  product_id: string;
  platform: string;
}

interface Ebook {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string | null;
  category: string | null;
  tags: string[] | null;
  cover_url: string;
  pdf_url: string;
  sample_pdf_url: string | null;
  current_price: number | null;
  original_price: number | null;
  discount_percentage: number | null;
  purchase_url: string | null;
  is_active: boolean;
  total_pages: number;
  estimated_reading_time: number | null;
  created_at: string;
  product_mappings?: ProductMapping[];
}

export default function AdminManage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [filteredEbooks, setFilteredEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedEbook, setSelectedEbook] = useState<Ebook | null>(null);
  const [ebookToDelete, setEbookToDelete] = useState<Ebook | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    checkAdminStatus();
  }, [authLoading, user, navigate, location.pathname]);

  useEffect(() => {
    filterEbooks();
  }, [searchTerm, statusFilter, ebooks]);

  useEffect(() => {
    return () => {
      setEbooks([]);
      setFilteredEbooks([]);
      setSearchTerm('');
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar esta página',
          variant: 'destructive',
        });
        navigate('/library');
        return;
      }

      fetchEbooks();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/library');
    }
  };

  const fetchEbooks = async () => {
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select(`
          *,
          product_mappings (
            product_id,
            platform
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Force fresh data by creating new arrays
      const freshData = data ? [...data] : [];
      setEbooks(freshData);
      setFilteredEbooks(freshData);
      const cats = Array.from(
        new Set(
          freshData
            .map((e) => e.category)
            .filter((c): c is string => Boolean(c))
        )
      ).sort((a, b) => a.localeCompare(b));
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching ebooks:', error);
      toast({
        title: 'Erro ao carregar ebooks',
        description: 'Não foi possível carregar a lista de ebooks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEbooks = () => {
    let filtered = [...ebooks];

    if (searchTerm) {
      filtered = filtered.filter(
        (ebook) =>
          ebook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ebook.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ebook.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((ebook) =>
        statusFilter === 'active' ? ebook.is_active : !ebook.is_active
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((ebook) => (ebook.category || '') === categoryFilter);
    }

    setFilteredEbooks(filtered);
  };

  const handleToggleActive = async (ebook: Ebook) => {
    try {
      const { error } = await supabase
        .from('ebooks')
        .update({ is_active: !ebook.is_active })
        .eq('id', ebook.id);

      if (error) throw error;

      toast({
        title: ebook.is_active ? 'Ebook desativado' : 'Ebook ativado',
        description: `"${ebook.title}" ${ebook.is_active ? 'não aparecerá mais' : 'agora aparecerá'} na vitrine`,
      });

      await logAdminEvent('admin_ebook_toggle_active', {
        ebook_id: ebook.id,
        new_status: !ebook.is_active,
      });

      fetchEbooks();
    } catch (error) {
      console.error('Error toggling ebook status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível alterar o status do ebook',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSuccess = () => {
    fetchEbooks();
    setEbookToDelete(null);
    // Switch to 'active' filter to hide deleted ebooks from view
    setStatusFilter('active');
  };

  const handleEditSuccess = async () => {
    setSelectedEbook(null);
    setLoading(true);
    await fetchEbooks();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/library')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Gerenciar Ebooks</h1>
          </div>
          <Button onClick={() => navigate('/admin/upload')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ebook
          </Button>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, autor ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {filteredEbooks.length} de {ebooks.length} ebooks
        </div>

        <div className="grid gap-4">
          {filteredEbooks.map((ebook) => (
            <Card key={`${ebook.id}-${ebook.is_active}`} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-6">
                <img
                  src={ebook.cover_url}
                  alt={ebook.title}
                  className="w-24 h-32 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold">{ebook.title}</h3>
                      {ebook.subtitle && (
                        <p className="text-sm text-muted-foreground">{ebook.subtitle}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={ebook.is_active ? 'default' : 'secondary'}>
                        {ebook.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {ebook.current_price && (
                        <Badge variant="outline">R$ {ebook.current_price.toFixed(2)}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Autor:</span>
                      <p className="font-medium">{ebook.author || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Categoria:</span>
                      <p className="font-medium">{ebook.category || 'Não informada'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Páginas:</span>
                      <p className="font-medium">{ebook.total_pages}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID do Produto:</span>
                      <p className="font-medium text-xs">
                        {ebook.product_mappings?.[0]?.product_id || (
                          <span className="text-destructive">Não configurado</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Link de compra:</span>
                      <p className="font-medium">
                        {ebook.purchase_url ? (
                          <a
                            href={ebook.purchase_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Configurado
                          </a>
                        ) : (
                          'Não configurado'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEbook(ebook)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant={ebook.is_active ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => handleToggleActive(ebook)}
                    >
                      {ebook.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setEbookToDelete(ebook)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredEbooks.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum ebook encontrado</p>
            </Card>
          )}
        </div>
      </div>

      {selectedEbook && (
        <EditEbookDialog
          ebook={selectedEbook}
          open={!!selectedEbook}
          onClose={() => setSelectedEbook(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {ebookToDelete && (
        <DeleteConfirmDialog
          ebook={ebookToDelete}
          open={!!ebookToDelete}
          onClose={() => setEbookToDelete(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
