import { useState, useEffect } from 'react';
import { Check, AlertCircle, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { logAdminEvent } from '@/lib/adminAudit';
import { toast } from '@/hooks/use-toast';

interface Ebook {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string | null;
  category: string | null;
  tags: string[] | null;
  total_pages: number;
  estimated_reading_time: number | null;
  current_price: number | null;
  original_price: number | null;
  discount_percentage: number | null;
  purchase_url: string | null;
  cover_url: string;
  pdf_url: string;
  sample_pdf_url: string | null;
}

interface EditEbookDialogProps {
  ebook: Ebook;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FILE_SIZE_LIMITS = {
  PDF: 100 * 1024 * 1024, // 100MB
  COVER: 20 * 1024 * 1024, // 20MB
  SAMPLE: 50 * 1024 * 1024, // 50MB
};

export function EditEbookDialog({ ebook, open, onClose, onSuccess }: EditEbookDialogProps) {
  const [formData, setFormData] = useState({
    title: ebook.title,
    subtitle: ebook.subtitle || '',
    description: ebook.description || '',
    author: ebook.author || '',
    category: ebook.category || '',
    tags: ebook.tags?.join(', ') || '',
    total_pages: ebook.total_pages,
    estimated_reading_time: ebook.estimated_reading_time || 0,
    current_price: ebook.current_price || '',
    original_price: ebook.original_price || '',
    discount_percentage: ebook.discount_percentage || '',
    purchase_url: ebook.purchase_url || '',
    product_id: '',
    platform: 'kiwify',
  });

  const [currentProductMapping, setCurrentProductMapping] = useState<{
    id: string;
    product_id: string;
    platform: string;
  } | null>(null);

  const [newCover, setNewCover] = useState<File | null>(null);
  const [newPdf, setNewPdf] = useState<File | null>(null);
  const [newSample, setNewSample] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const validateForm = (): boolean => {
    if (!formData.title || formData.title.trim().length === 0) {
      toast({
        title: 'Título obrigatório',
        description: 'Informe um título para o ebook.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.total_pages || Number.isNaN(formData.total_pages) || formData.total_pages <= 0) {
      toast({
        title: 'Total de páginas inválido',
        description: 'Informe um número de páginas maior que zero.',
        variant: 'destructive',
      });
      return false;
    }

    const original = formData.original_price;
    const current = formData.current_price;
    const discount = formData.discount_percentage;

    const toNum = (v: any) => (v === '' || v === null || typeof v === 'undefined' ? null : parseFloat(v));
    const originalNum = toNum(original);
    const currentNum = toNum(current);
    const discountNum = toNum(discount);

    if (originalNum !== null && (Number.isNaN(originalNum) || originalNum < 0)) {
      toast({ title: 'Preço original inválido', description: 'Preço não pode ser negativo.', variant: 'destructive' });
      return false;
    }

    if (currentNum !== null && (Number.isNaN(currentNum) || currentNum < 0)) {
      toast({ title: 'Preço atual inválido', description: 'Preço não pode ser negativo.', variant: 'destructive' });
      return false;
    }

    if (discountNum !== null) {
      if (Number.isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
        toast({ title: 'Desconto inválido', description: 'Informe um valor entre 0 e 100.', variant: 'destructive' });
        return false;
      }
    }

    if (formData.purchase_url) {
      try {
        const u = new URL(formData.purchase_url);
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Invalid protocol');
      } catch (e) {
        toast({ title: 'URL de compra inválida', description: 'Informe uma URL válida com http(s).', variant: 'destructive' });
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    const fetchProductMapping = async () => {
      if (!open) return;

      const { data } = await supabase
        .from('product_mappings')
        .select('*')
        .eq('ebook_id', ebook.id)
        .maybeSingle();

      if (data) {
        setCurrentProductMapping(data);
        setFormData(prev => ({
          ...prev,
          product_id: data.product_id,
          platform: data.platform
        }));
      } else {
        setCurrentProductMapping(null);
        setFormData(prev => ({
          ...prev,
          product_id: '',
          platform: 'kiwify'
        }));
      }
    };

    fetchProductMapping();
  }, [ebook.id, open]);

  const sanitizeFileName = (fileName: string): string => {
    const timestamp = Date.now();
    const name = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    return `${timestamp}-${name}`;
  };

  const validateFile = (file: File, limit: number): boolean => {
    if (file.size > limit) {
      toast({
        title: 'Arquivo muito grande',
        description: `O arquivo deve ter no máximo ${(limit / 1024 / 1024).toFixed(0)}MB`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const sanitizedName = sanitizeFileName(file.name);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(sanitizedName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Para bucket privado 'ebooks', retornar apenas o path relativo
    // Para buckets públicos (covers, samples), retornar URL pública
    if (bucket === 'ebooks') {
      return data.path;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Validate form fields
      if (!validateForm()) {
        setUploading(false);
        return;
      }
      // Validate files if new ones are provided
      if (newCover && !validateFile(newCover, FILE_SIZE_LIMITS.COVER)) {
        setUploading(false);
        return;
      }
      if (newPdf && !validateFile(newPdf, FILE_SIZE_LIMITS.PDF)) {
        setUploading(false);
        return;
      }
      if (newSample && !validateFile(newSample, FILE_SIZE_LIMITS.SAMPLE)) {
        setUploading(false);
        return;
      }

      // Upload new files if provided
      let coverUrl = ebook.cover_url;
      let pdfUrl = ebook.pdf_url;
      let sampleUrl = ebook.sample_pdf_url;

      if (newCover) {
        const url = await uploadFile(newCover, 'covers');
        if (url) coverUrl = url;
      }

      if (newPdf) {
        // Para ebooks, uploadFile retorna o path relativo (bucket privado)
        const path = await uploadFile(newPdf, 'ebooks');
        if (path) pdfUrl = path;
      }

      if (newSample) {
        const url = await uploadFile(newSample, 'samples');
        if (url) sampleUrl = url;
      }

      // Update ebook data
      const { error } = await supabase
        .from('ebooks')
        .update({
          title: formData.title,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          author: formData.author || null,
          category: formData.category || null,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
          total_pages: formData.total_pages,
          estimated_reading_time: formData.estimated_reading_time || null,
          current_price: formData.current_price ? parseFloat(formData.current_price.toString()) : null,
          original_price: formData.original_price ? parseFloat(formData.original_price.toString()) : null,
          discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage.toString()) : null,
          purchase_url: formData.purchase_url || null,
          cover_url: coverUrl,
          pdf_url: pdfUrl,
          sample_pdf_url: sampleUrl,
        })
        .eq('id', ebook.id);

      if (error) throw error;

      // Update or insert product mapping
      if (formData.product_id?.trim()) {
        // Check if product_id is already used by another ebook
        const { data: existingMapping } = await supabase
          .from('product_mappings')
          .select('product_id, ebook_id')
          .eq('product_id', formData.product_id.trim())
          .maybeSingle();

        if (existingMapping && existingMapping.ebook_id !== ebook.id) {
          toast({
            title: 'ID do Produto já existe',
            description: 'Este ID já está vinculado a outro ebook. Use um ID único.',
            variant: 'destructive'
          });
          setUploading(false);
          return;
        }

        if (currentProductMapping) {
          // Update existing mapping
          const { error: mappingError } = await supabase
            .from('product_mappings')
            .update({
              product_id: formData.product_id.trim(),
              platform: formData.platform || 'kiwify'
            })
            .eq('id', currentProductMapping.id);

          if (mappingError) throw mappingError;
        } else {
          // Create new mapping
          const { error: mappingError } = await supabase
            .from('product_mappings')
            .insert({
              ebook_id: ebook.id,
              product_id: formData.product_id.trim(),
              platform: formData.platform || 'kiwify'
            });

          if (mappingError) throw mappingError;
        }
      }

      // Audit log: compute diff
      const before = {
        title: ebook.title,
        subtitle: ebook.subtitle || null,
        description: ebook.description || null,
        author: ebook.author || null,
        category: ebook.category || null,
        tags: ebook.tags || null,
        total_pages: ebook.total_pages,
        estimated_reading_time: ebook.estimated_reading_time || null,
        current_price: ebook.current_price || null,
        original_price: ebook.original_price || null,
        discount_percentage: ebook.discount_percentage || null,
        purchase_url: ebook.purchase_url || null,
        cover_url: ebook.cover_url,
        pdf_url: ebook.pdf_url,
        sample_pdf_url: ebook.sample_pdf_url || null,
      };

      const after = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description || null,
        author: formData.author || null,
        category: formData.category || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        total_pages: formData.total_pages,
        estimated_reading_time: formData.estimated_reading_time || null,
        current_price: formData.current_price ? parseFloat(formData.current_price.toString()) : null,
        original_price: formData.original_price ? parseFloat(formData.original_price.toString()) : null,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage.toString()) : null,
        purchase_url: formData.purchase_url || null,
        cover_url: coverUrl,
        pdf_url: pdfUrl,
        sample_pdf_url: sampleUrl,
      };

      const changes: Record<string, { before: any; after: any }> = {};
      Object.keys(after).forEach((key) => {
        // shallow compare
        // stringify arrays for comparison
        const b = (before as any)[key];
        const a = (after as any)[key];
        const sb = Array.isArray(b) ? JSON.stringify(b) : b;
        const sa = Array.isArray(a) ? JSON.stringify(a) : a;
        if (sb !== sa) {
          changes[key] = { before: b, after: a };
        }
      });

      await logAdminEvent('admin_ebook_edit', {
        ebook_id: ebook.id,
        changes,
        files_changed: {
          cover: !!newCover,
          pdf: !!newPdf,
          sample: !!newSample,
        },
      });

      toast({
        title: 'Ebook atualizado com sucesso!',
        description: 'As alterações foram salvas',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating ebook:', error);
      toast({
        title: 'Erro ao atualizar ebook',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Ebook</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="relacionamento, autoconhecimento, despertar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_pages">Total de Páginas *</Label>
              <Input
                id="total_pages"
                type="number"
                value={formData.total_pages}
                onChange={(e) => setFormData({ ...formData, total_pages: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_reading_time">Tempo de Leitura (min)</Label>
              <Input
                id="estimated_reading_time"
                type="number"
                value={formData.estimated_reading_time}
                onChange={(e) => setFormData({ ...formData, estimated_reading_time: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Vinculação de Produto</h3>
            <div className="space-y-2 mb-4">
              <Label htmlFor="product_id">ID do Produto (Kiwify)</Label>
              <Input
                id="product_id"
                value={formData.product_id || ''}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                placeholder="Ex: 625e5f79-ad1f-49b0-abf0-43cca3864c6e"
              />
              <p className="text-sm text-muted-foreground">
                Vincula este ebook às compras na plataforma de pagamento
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Precificação</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="original_price">Preço Original</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  placeholder="29.90"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_price">Preço Atual</Label>
                <Input
                  id="current_price"
                  type="number"
                  step="0.01"
                  value={formData.current_price}
                  onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                  placeholder="19.90"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_percentage">Desconto (%)</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  placeholder="33"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="purchase_url">Link de Compra</Label>
              <Input
                id="purchase_url"
                type="url"
                value={formData.purchase_url}
                onChange={(e) => setFormData({ ...formData, purchase_url: e.target.value })}
                placeholder="https://pay.cakto.com.br/seu-produto"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Arquivos (deixe em branco para manter os atuais)</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cover">Nova Capa (máx. 20MB)</Label>
                <Input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewCover(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf">Novo PDF Principal (máx. 100MB)</Label>
                <Input
                  id="pdf"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setNewPdf(e.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample">Nova Amostra (máx. 50MB)</Label>
                <Input
                  id="sample"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setNewSample(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
