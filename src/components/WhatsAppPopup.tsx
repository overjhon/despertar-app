import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WhatsAppPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
}

const formatWhatsApp = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const extractDigits = (value: string): string => value.replace(/\D/g, '');

export const WhatsAppPopup = ({ open, onOpenChange, userId }: WhatsAppPopupProps) => {
    const [whatsapp, setWhatsapp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        const digits = extractDigits(whatsapp);
        if (digits.length < 10 || digits.length > 11) {
            toast.error('Número inválido', { description: 'Insira um número com DDD (10 ou 11 dígitos).' });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ whatsapp: digits })
                .eq('id', userId);

            if (error) throw error;

            toast.success('WhatsApp salvo!', { description: 'Você receberá promoções e novidades.' });
            onOpenChange(false);
        } catch (err) {
            console.error('Erro ao salvar WhatsApp:', err);
            toast.error('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="h-6 w-6 text-green-500" />
                        <DialogTitle className="text-xl">Seu WhatsApp</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Receba promoções exclusivas, novidades e informações da comunidade diretamente no seu WhatsApp.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp-input">Número de WhatsApp</Label>
                        <Input
                            id="whatsapp-input"
                            placeholder="(11) 99999-9999"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                            autoComplete="off"
                            className="h-11 text-base"
                        />
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={loading || extractDigits(whatsapp).length < 10}
                        variant="premium"
                        className="w-full h-11"
                    >
                        {loading ? 'Salvando...' : 'Salvar WhatsApp'}
                    </Button>

                    <button
                        onClick={() => onOpenChange(false)}
                        className="w-full text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
                    >
                        Agora não, obrigada
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
