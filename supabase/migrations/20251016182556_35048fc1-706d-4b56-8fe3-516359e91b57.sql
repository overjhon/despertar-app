-- Criar tabela de compras pendentes
CREATE TABLE public.pending_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  offer_id TEXT,
  product_id TEXT,
  ebook_id UUID,
  ebook_name TEXT,
  amount NUMERIC,
  transaction_id TEXT UNIQUE NOT NULL,
  paid_at TIMESTAMPTZ,
  raw_payload JSONB,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  claimed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_pending_purchases_email ON public.pending_purchases(email);
CREATE INDEX idx_pending_purchases_transaction ON public.pending_purchases(transaction_id);
CREATE INDEX idx_pending_purchases_claimed ON public.pending_purchases(claimed, email);

-- Habilitar RLS
ALTER TABLE public.pending_purchases ENABLE ROW LEVEL SECURITY;

-- Política deny-all (apenas backend via service role)
CREATE POLICY "Backend only access"
ON public.pending_purchases
FOR ALL
USING (false)
WITH CHECK (false);