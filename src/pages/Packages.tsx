import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { usePurchaseTracking } from "@/hooks/usePurchaseTracking";
import { PageSEO } from "@/components/seo/PageSEO";
import { trackInitiateCheckout } from "@/lib/facebookPixel";
import { BRAND_NAME, DEFAULT_DESCRIPTION } from '@/config/brand';

interface Ebook {
  id: string;
  title: string;
  cover_url: string;
  current_price: number;
}

export default function Packages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackClick } = usePurchaseTracking();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchEbooks();
  }, [user, navigate]);

  const fetchEbooks = async () => {
    try {
      const { data, error } = await supabase
        .from("ebooks")
        .select("id, title, cover_url, current_price")
        .eq("is_active", true)
        .not("current_price", "is", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setEbooks(data || []);
    } catch (error) {
      console.error("Error fetching ebooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalOriginalPrice = 96.7; // Sum of all original prices
  const packagePrice = 59.9;
  const savings = totalOriginalPrice - packagePrice;
  const savingsPercentage = Math.round((savings / totalOriginalPrice) * 100);

  const handlePurchase = () => {
    // Track click for package (using first ebook id as reference)
    if (ebooks.length > 0) {
      trackClick(ebooks[0].id);
    }
    // Track initiate checkout with Meta Pixel
    trackInitiateCheckout(packagePrice);
    // In the future, this would open a specific package purchase URL
    window.open("https://pay.cakto.com.br/dmudhws_611361", "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={`Pacote Completo - ${BRAND_NAME}`}
        description={DEFAULT_DESCRIPTION}
        path="/packages"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => navigate("/library")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Biblioteca
          </Button>

          <div className="mb-8 text-center">
            <Badge variant="destructive" className="mb-4 text-lg px-6 py-2 animate-pulse">
              MELHOR VALOR 🎁
            </Badge>
            <h1 className="text-4xl font-bold mb-2">Pacote Despertar Completo</h1>
            <p className="text-muted-foreground text-lg">A coleção completa para transformar sua jornada de despertar</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="p-6 border-2 border-primary shadow-lg">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-4 text-primary">🎯 O que está incluído:</h3>
                  <div className="space-y-3">
                    {ebooks.map((ebook) => (
                      <div key={ebook.id} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{ebook.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Valor individual: R$ {ebook.current_price?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor individual:</span>
                      <span className="line-through">R$ {totalOriginalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold">
                      <span className="text-primary">Pacote completo:</span>
                      <span className="text-primary">R$ {packagePrice.toFixed(2)}</span>
                    </div>
                    <div className="text-center">
                      <Badge variant="secondary" className="text-base px-4 py-1">
                        Economia de R$ {savings.toFixed(2)} ({savingsPercentage}%)
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
                <h3 className="text-xl font-bold mb-4">✨ Bônus Exclusivos:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-primary">1</Badge>
                    <p className="text-sm">Acesso imediato a todos os 4 ebooks</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-primary">2</Badge>
                    <p className="text-sm">Suporte prioritário por WhatsApp</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-primary">3</Badge>
                    <p className="text-sm">Grupo VIP exclusivo com outras mestras</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-primary">4</Badge>
                    <p className="text-sm">+1500 XP de bônus na plataforma</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-primary">5</Badge>
                    <p className="text-sm">Badge especial "Especialista Despertar" 👑</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">🎓 Garantias:</h3>
                <div className="space-y-2 text-sm">
                  <p>✓ 7 dias de garantia total</p>
                  <p>✓ Acesso vitalício ao conteúdo</p>
                  <p>✓ Atualizações gratuitas</p>
                  <p>✓ Pagamento único, sem mensalidades</p>
                  <p>✓ Certificado digital de conclusão</p>
                </div>
              </Card>
            </div>
          </div>

          <Card className="p-8 bg-gradient-primary text-primary-foreground">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Pronta para iniciar sua jornada de despertar?</h3>
              <p className="text-lg opacity-90">Junte-se a mais de 500 mulheres que já transformaram suas vidas</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                  onClick={handlePurchase}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Comprar Pacote Completo
                </Button>
              </div>
              <p className="text-sm opacity-75 mt-4">🔒 Pagamento 100% seguro via Cakto | Pix, Cartão ou Boleto</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
