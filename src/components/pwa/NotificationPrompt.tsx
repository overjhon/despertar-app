import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

interface NotificationPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: () => void;
}

export const NotificationPrompt = ({ open, onOpenChange, onEnable }: NotificationPromptProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <Bell className="w-6 h-6 text-primary" />
          Ativar Notificações? 🔔
        </DialogTitle>
        <DialogDescription className="text-base">
          Receba avisos sobre novos ebooks, desafios e conquistas!
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-3 pt-4">
        <Button onClick={onEnable} variant="premium" className="w-full">
          Sim, quero receber!
        </Button>
        <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
          Agora não
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
