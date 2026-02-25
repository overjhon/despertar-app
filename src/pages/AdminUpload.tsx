import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, BookOpen, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Limites de tamanho em bytes
const FILE_SIZE_LIMITS = {
  pdf: 100 * 1024 * 1024, // 100 MB
  cover: 20 * 1024 * 1024, // 20 MB
  sample: 50 * 1024 * 1024, // 50 MB
};

// Função para sanitizar nomes de arquivos
const sanitizeFileName = (fileName: string): string => {
  const extension = fileName.slice(fileName.lastIndexOf('.'));
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));

  const sanitized = nameWithoutExt
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Substitui caracteres especiais por hífen
    .replace(/--+/g, '-') // Remove hífens duplicados
    .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
    .toLowerCase();

  const timestamp = Date.now();
  return `${sanitized}-${timestamp}${extension}`;
};

// Função para formatar tamanho em MB
const formatFileSize = (bytes: number): string => {
  return (bytes / (1024 * 1024)).toFixed(1);
};

// Função para verificar se arquivo excede o limite
const checkFileSize = (file: File, limit: number): boolean => {
  return file.size <= limit;
};

const AdminUpload = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const isSubmitting = useRef(false); // Guard síncrono contra double-submit

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [estimatedReadingTime, setEstimatedReadingTime] = useState('');

  // Product mapping state
  const [productId, setProductId] = useState('');
  const [platform, setPlatform] = useState('kiwify');

  // File state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);

  // Validation state
  const [pdfValid, setPdfValid] = useState(true);
  const [coverValid, setCoverValid] = useState(true);
  const [sampleValid, setSampleValid] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    checkAdminStatus();
  }, [authLoading, user, navigate, location.pathname]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) throw error;

      if (!data) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive"
        });
        navigate('/library');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File | null, type: 'pdf' | 'cover' | 'sample'): boolean => {
    if (!file) return true; // Arquivos opcionais são válidos se não forem fornecidos

    const limit = FILE_SIZE_LIMITS[type];
    const isValid = checkFileSize(file, limit);

    if (!isValid) {
      const limitMB = formatFileSize(limit);
      const fileSizeMB = formatFileSize(file.size);
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo ${file.name} (${fileSizeMB} MB) excede o limite de ${limitMB} MB.`,
        variant: "destructive"
      });
    }

    return isValid;
  };

  const uploadFile = async (file: File, bucket: string, originalFileName: string) => {
    const sanitizedFileName = sanitizeFileName(originalFileName);
    const path = bucket === 'covers' ? sanitizedFileName : `${crypto.randomUUID()}/${sanitizedFileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      // Tratamento de erros específicos
      if (error.message.includes('maximum allowed size')) {
        throw new Error(`O arquivo excedeu o tamanho máximo permitido. Limite: ${formatFileSize(FILE_SIZE_LIMITS[bucket as keyof typeof FILE_SIZE_LIMITS])} MB`);
      } else if (error.message.includes('Invalid key')) {
        throw new Error(`Nome de arquivo inválido. Por favor, renomeie o arquivo e tente novamente.`);
      }
      throw error;
    }

    return { data, sanitizedFileName: path };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: previne submissão dupla mesmo com cliques rápidos
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    if (!pdfFile || !coverFile) {
      toast({
        title: "Arquivos obrigatórios",
        description: "PDF e capa são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!productId.trim()) {
      toast({
        title: "ID do Produto obrigatório",
        description: "Você precisa informar o ID do produto para vincular às compras.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanhos dos arquivos antes de fazer upload
    const isPdfValid = validateFile(pdfFile, 'pdf');
    const isCoverValid = validateFile(coverFile, 'cover');
    const isSampleValid = validateFile(sampleFile, 'sample');

    setPdfValid(isPdfValid);
    setCoverValid(isCoverValid);
    setSampleValid(isSampleValid);

    if (!isPdfValid || !isCoverValid || !isSampleValid) {
      toast({
        title: "Validação falhou",
        description: "Um ou mais arquivos excedem o tamanho máximo permitido.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const ebookId = crypto.randomUUID();

      // Upload PDF
      const { sanitizedFileName: pdfPath } = await uploadFile(pdfFile, 'ebooks', pdfFile.name);

      // Upload Cover
      const { sanitizedFileName: coverPath } = await uploadFile(coverFile, 'covers', coverFile.name);

      // Upload Sample (optional)
      let samplePath = null;
      if (sampleFile) {
        const { sanitizedFileName } = await uploadFile(sampleFile, 'samples', sampleFile.name);
        samplePath = sanitizedFileName;
      }

      // Get URLs - covers e samples são buckets públicos, ebooks é privado
      // Para o bucket privado 'ebooks', salvamos apenas o path relativo
      // e geramos signed URLs na hora da leitura
      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(coverPath);

      const sampleUrl = samplePath
        ? supabase.storage.from('samples').getPublicUrl(samplePath).data.publicUrl
        : null;

      // Insert ebook record
      const { error: insertError } = await supabase
        .from('ebooks')
        .insert({
          id: ebookId,
          title,
          subtitle: subtitle || null,
          description: description || null,
          author: author || null,
          category: category || null,
          tags: tags ? tags.split(',').map(t => t.trim()) : null,
          total_pages: parseInt(totalPages),
          estimated_reading_time: estimatedReadingTime ? parseInt(estimatedReadingTime) : null,
          pdf_url: pdfPath, // Path relativo no bucket privado 'ebooks'
          cover_url: coverUrl,
          sample_pdf_url: sampleUrl,
          is_active: true
        });

      if (insertError) throw insertError;

      // Insert product mapping
      const { error: mappingError } = await supabase
        .from('product_mappings')
        .insert({
          ebook_id: ebookId,
          product_id: productId.trim(),
          platform: platform
        });

      if (mappingError) throw mappingError;

      toast({
        title: "Ebook adicionado!",
        description: "O ebook foi carregado com sucesso e vinculado ao produto.",
      });

      // Reset form
      setTitle('');
      setSubtitle('');
      setDescription('');
      setAuthor('');
      setCategory('');
      setTags('');
      setTotalPages('');
      setEstimatedReadingTime('');
      setProductId('');
      setPlatform('kiwify');
      setPdfFile(null);
      setCoverFile(null);
      setSampleFile(null);
      setPdfValid(true);
      setCoverValid(true);
      setSampleValid(true);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer o upload. Verifique se os arquivos não excedem os limites de tamanho.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      isSubmitting.current = false;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/library')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Admin - Upload de Ebook</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Adicionar Novo Ebook
            </CardTitle>
            <CardDescription>
              Preencha as informações e faça upload dos arquivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações básicas */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ex: Guia Completo de Relacionamentos"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: Transforme sua casa em uma fábrica de aromas"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição detalhada do ebook"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="author">Autor</Label>
                    <Input
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Ex: Equipe Despertar"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ex: Receitas"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Ex: relacionamento, autoconhecimento, despertar"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalPages">Total de Páginas *</Label>
                    <Input
                      id="totalPages"
                      type="number"
                      value={totalPages}
                      onChange={(e) => setTotalPages(e.target.value)}
                      required
                      placeholder="Ex: 32"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimatedReadingTime">Tempo de Leitura (min)</Label>
                    <Input
                      id="estimatedReadingTime"
                      type="number"
                      value={estimatedReadingTime}
                      onChange={(e) => setEstimatedReadingTime(e.target.value)}
                      placeholder="Ex: 45"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="productId">ID do Produto (Kiwify) *</Label>
                  <Input
                    id="productId"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                    placeholder="Ex: 625e5f79-ad1f-49b0-abf0-43cca3864c6e"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Este ID vincula o ebook às compras na plataforma de pagamento
                  </p>
                </div>
              </div>

              {/* Upload de arquivos */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Arquivos</h3>

                <div>
                  <Label htmlFor="pdf">PDF do Ebook * (máx {formatFileSize(FILE_SIZE_LIMITS.pdf)} MB)</Label>
                  <Input
                    id="pdf"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setPdfFile(file);
                      if (file) {
                        const isValid = validateFile(file, 'pdf');
                        setPdfValid(isValid);
                      }
                    }}
                    required
                    className={`cursor-pointer ${!pdfValid ? 'border-destructive' : ''}`}
                  />
                  {pdfFile && (
                    <p className={`text-sm mt-1 flex items-center gap-2 ${pdfValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                      {pdfValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {pdfFile.name} ({formatFileSize(pdfFile.size)} MB / {formatFileSize(FILE_SIZE_LIMITS.pdf)} MB)
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Arquivo muito grande: {formatFileSize(pdfFile.size)} MB (máx {formatFileSize(FILE_SIZE_LIMITS.pdf)} MB)
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cover">Imagem da Capa * (máx {formatFileSize(FILE_SIZE_LIMITS.cover)} MB)</Label>
                  <Input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setCoverFile(file);
                      if (file) {
                        const isValid = validateFile(file, 'cover');
                        setCoverValid(isValid);
                      }
                    }}
                    required
                    className={`cursor-pointer ${!coverValid ? 'border-destructive' : ''}`}
                  />
                  {coverFile && (
                    <p className={`text-sm mt-1 flex items-center gap-2 ${coverValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                      {coverValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {coverFile.name} ({formatFileSize(coverFile.size)} MB / {formatFileSize(FILE_SIZE_LIMITS.cover)} MB)
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Arquivo muito grande: {formatFileSize(coverFile.size)} MB (máx {formatFileSize(FILE_SIZE_LIMITS.cover)} MB)
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sample">PDF de Amostra (máx {formatFileSize(FILE_SIZE_LIMITS.sample)} MB) - opcional</Label>
                  <Input
                    id="sample"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSampleFile(file);
                      if (file) {
                        const isValid = validateFile(file, 'sample');
                        setSampleValid(isValid);
                      }
                    }}
                    className={`cursor-pointer ${!sampleValid ? 'border-destructive' : ''}`}
                  />
                  {sampleFile && (
                    <p className={`text-sm mt-1 flex items-center gap-2 ${sampleValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                      {sampleValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {sampleFile.name} ({formatFileSize(sampleFile.size)} MB / {formatFileSize(FILE_SIZE_LIMITS.sample)} MB)
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Arquivo muito grande: {formatFileSize(sampleFile.size)} MB (máx {formatFileSize(FILE_SIZE_LIMITS.sample)} MB)
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={uploading || !pdfValid || !coverValid || !sampleValid} className="w-full" size="lg">
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Fazendo upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Adicionar Ebook
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminUpload;
