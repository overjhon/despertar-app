import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { logAdminEvent } from '@/lib/adminAudit';
import { toast } from '@/hooks/use-toast';

interface Ebook {
  id: string;
  title: string;
}

interface DeleteConfirmDialogProps {
  ebook: Ebook;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteConfirmDialog({
  ebook,
  open,
  onClose,
  onSuccess,
}: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      // Check if any users have this ebook
      const { data: userEbooks, error: checkError } = await supabase
        .from('user_ebooks')
        .select('id')
        .eq('ebook_id', ebook.id)
        .limit(1);

      if (checkError) throw checkError;
      if (userEbooks && userEbooks.length > 0) {
        // Soft delete if users have acquired the ebook
        const { error: ebookError } = await supabase
          .from('ebooks')
          .update({ is_active: false })
          .eq('id', ebook.id);

        if (ebookError) throw ebookError;

        // Delete associated product mapping to prevent new purchases and allow reuse
        const { error: mappingError } = await supabase
          .from('product_mappings')
          .delete()
          .eq('ebook_id', ebook.id);

        if (mappingError && mappingError.code !== 'PGRST116') {
          console.warn('Error deleting product mapping:', mappingError);
        }

        await logAdminEvent('admin_ebook_soft_delete', {
          ebook_id: ebook.id,
          reason: 'has_existing_users',
        });

        toast({
          title: 'Ebook desativado',
          description: `"${ebook.title}" foi desativado (usuários já adquiriram).`,
        });
      } else {
        // Permanent delete when safe (no user acquisitions)
        // 1) Delete product_mappings FIRST to avoid FK 23503
        const { error: mappingError } = await supabase
          .from('product_mappings')
          .delete()
          .eq('ebook_id', ebook.id);

        if (mappingError && mappingError.code !== 'PGRST116') {
          console.warn('Error deleting product mapping:', mappingError);
        }

        // 2) Now delete ebook
        const { error: deleteError } = await supabase
          .from('ebooks')
          .delete()
          .eq('id', ebook.id);

        if (deleteError) throw deleteError;

        await logAdminEvent('admin_ebook_delete', {
          ebook_id: ebook.id,
          reason: 'no_existing_users',
        });

        toast({
          title: 'Ebook excluído definitivamente',
          description: `"${ebook.title}" foi removido do sistema.`,
        });
      }

      onSuccess();
    } catch (error: any) {
      // Opcional: documenta parâmetros de conexão para acelerar diagnósticos
      try {
        const { logSupabaseConnectionDoc } = await import('@/lib/dbConfigDoc');
        logSupabaseConnectionDoc('delete_ebook_error', { error, context: { ebook_id: ebook.id } });
      } catch {}
      console.error('Error deleting ebook:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir o ebook <strong>"{ebook.title}"</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Nota: Se usuários já adquiriram este ebook, ele será apenas desativado
              (não aparecerá na vitrine) ao invés de ser permanentemente excluído.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
