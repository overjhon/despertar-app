import { useCreations } from '@/hooks/useCreations';
import { CreationCard } from '@/components/community/CreationCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useAuth } from '@/contexts/AuthContext';

export const GalleryPage = () => {
  const { creations, loading, createCreation, toggleLike } = useCreations();
  const { uploadMedia, uploading } = useMediaUpload();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;

    const urls = await uploadMedia([selectedFile]);
    if (urls.length === 0) return;

    const result = await createCreation(title, description, urls[0], null, difficulty);
    
    if (result.success) {
      setOpen(false);
      setTitle('');
      setDescription('');
      setDifficulty('medium');
      setSelectedFile(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Galeria de Criações</h1>
            <p className="text-muted-foreground">
              Veja o que outras artesãs criaram com nossos ebooks
            </p>
          </div>

          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Compartilhar Criação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compartilhar Sua Criação</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Foto da Vela</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Título</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nome da sua vela"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Descrição</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Conte sobre sua criação..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Dificuldade</label>
                    <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" disabled={uploading} className="w-full">
                    {uploading ? 'Enviando...' : 'Publicar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {creations.map(creation => (
            <CreationCard
              key={creation.id}
              creation={creation}
              onLike={toggleLike}
            />
          ))}

          {creations.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                Nenhuma criação compartilhada ainda. Seja a primeira!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
