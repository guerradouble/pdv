-- Add tipo column to pedidos_balcao table to differentiate between balcao and delivery orders
ALTER TABLE public.pedidos_balcao
ADD COLUMN tipo text NOT NULL DEFAULT 'balcao'::text;

-- Add check constraint to ensure only valid tipos
ALTER TABLE public.pedidos_balcao
ADD CONSTRAINT pedidos_balcao_tipo_check CHECK (
  tipo = ANY (ARRAY['balcao'::text, 'delivery'::text])
);

-- Create index on tipo for faster queries
CREATE INDEX IF NOT EXISTS idx_pedidos_balcao_tipo 
ON public.pedidos_balcao USING btree (tipo);
