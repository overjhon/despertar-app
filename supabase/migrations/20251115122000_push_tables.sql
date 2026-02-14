-- Tabela de logs de entrega de push
CREATE TABLE IF NOT EXISTS public.push_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL,
  message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_delivery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all push logs"
  ON public.push_delivery_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert push logs"
  ON public.push_delivery_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Alterar push_subscriptions para suportar FCM
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS fcm_token text,
  ADD COLUMN IF NOT EXISTS device_info jsonb,
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_fcm_token ON public.push_subscriptions(fcm_token);
CREATE INDEX IF NOT EXISTS idx_push_delivery_logs_user ON public.push_delivery_logs(user_id, created_at DESC);