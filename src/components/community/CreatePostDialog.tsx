import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Sparkles, Image as ImageIcon, Video, X, Loader2 } from 'lucide-react';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/useIsMobile';
import { postContentSchema } from '@/lib/validation';
import { toast } from 'sonner';

interface CreatePostDialogProps {
  onCreatePost: (content: string, mediaUrls: string[]) => Promise<{ success: boolean }>;
}

export const CreatePostDialog = ({ onCreatePost }: CreatePostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const { uploadMedia, uploading, progress } = useMediaUpload();
  const isMobile = useIsMobile();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validar tamanho e tipo MIME real
    const validatedFiles: File[] = [];

    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

      // Validar tamanho
      if (file.size > maxSize) {
        toast.error(`${file.name} muito grande. Máximo ${isVideo ? '50MB' : '10MB'}`);
        continue;
      }

      // Validar tipo MIME real (importar validateImage/validateVideo)
      const { validateImage, validateVideo } = await import('@/lib/fileValidation');
      const validator = isVideo ? validateVideo : validateImage;
      const result = await validator(file);

      if (!result.valid) {
        toast.error(`${file.name}: ${result.error}`);
        continue;
      }

      validatedFiles.push(file);
    }

    if (validatedFiles.length === 0) return;

    // Limitar a 4 imagens ou 1 vídeo
    const hasVideo = validatedFiles.some(f => f.type.startsWith('video/'));
    const finalFiles = hasVideo ? validatedFiles.slice(0, 1) : validatedFiles.slice(0, 4);

    setSelectedFiles(finalFiles);

    // Criar previews
    const newPreviews = finalFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    // Validate content if provided
    if (content.trim()) {
      const contentValidation = postContentSchema.safeParse(content);
      if (!contentValidation.success) {
        toast.error(contentValidation.error.errors[0].message);
        return;
      }
    }

    if (!content.trim() && selectedFiles.length === 0) {
      toast.error('Adicione um texto ou imagem');
      return;
    }

    setCreating(true);

    try {
      // Upload de mídia se houver
      let mediaUrls: string[] = [];
      if (selectedFiles.length > 0) {
        mediaUrls = await uploadMedia(selectedFiles);
        if (mediaUrls.length === 0 && selectedFiles.length > 0) {
          setCreating(false);
          return;
        }
      }

      // Criar post
      const result = await onCreatePost(content, mediaUrls);

      if (result.success) {
        setContent('');
        setSelectedFiles([]);
        setPreviews([]);
        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const renderFormContent = () => (
    <div className="space-y-4 p-1">
      <Textarea
        placeholder="O que você está pensando hoje? Compartilhe suas experiências e reflexões... 💕"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[120px] resize-none"
        maxLength={2000}
        autoFocus={false}
      />

      {/* Preview de arquivos */}
      {previews.length > 0 && (
        <div className={`grid gap-2 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {previews.map((preview, index) => {
            const isVideo = selectedFiles[index].type.startsWith('video/');

            return (
              <div key={index} className="relative group rounded-lg overflow-hidden">
                {isVideo ? (
                  <video
                    src={preview}
                    controls
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Botões de adicionar mídia */}
      <div className="flex gap-2">
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          id="image-upload"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading || creating}
        />
        <label htmlFor="image-upload" className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full pointer-events-none"
            disabled={uploading || creating || selectedFiles.some(f => f.type.startsWith('video/'))}
            asChild
          >
            <span className="pointer-events-auto cursor-pointer">
              <ImageIcon className="w-4 h-4 mr-2" />
              Fotos
            </span>
          </Button>
        </label>

        <Input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          id="video-upload"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading || creating}
        />
        <label htmlFor="video-upload" className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full pointer-events-none"
            disabled={uploading || creating || selectedFiles.length > 0}
            asChild
          >
            <span className="pointer-events-auto cursor-pointer">
              <Video className="w-4 h-4 mr-2" />
              Vídeo
            </span>
          </Button>
        </label>
      </div>

      {/* Barra de progresso do upload */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">
            Fazendo upload... {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Contador de caracteres */}
      <div className="text-right text-sm text-muted-foreground">
        {content.length}/2000
      </div>

      {/* Botão de publicar */}
      <Button
        onClick={handleSubmit}
        disabled={(!content.trim() && selectedFiles.length === 0) || uploading || creating}
        variant="premium"
      >
        {(uploading || creating) ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {uploading ? 'Fazendo upload...' : 'Publicando...'}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Publicar
          </>
        )}
      </Button>
    </div>
  );

  // Mobile: usa Sheet (gaveta)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg"
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Criar Postagem
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] p-0 overflow-y-auto">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ✨ Compartilhe suas ideias
            </SheetTitle>
          </SheetHeader>
          <div className="px-6">
            {renderFormContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: usa Dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Criar Postagem
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ✨ Compartilhe suas ideias
          </DialogTitle>
        </DialogHeader>
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  );
};
