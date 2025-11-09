-- Drop existing table
DROP TABLE IF EXISTS public.pedidos_balcao CASCADE;

-- Create main orders table
CREATE TABLE public.pedidos_balcao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  telefone TEXT,
  mesa TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pronto', 'cancelado')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table
CREATE TABLE public.pedidos_balcao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos_balcao(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.cadastro_cardapio(id) ON DELETE RESTRICT,
  produto_nome TEXT NOT NULL,
  produto_preco NUMERIC(10, 2) NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  subtotal NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_pedidos_balcao_status ON public.pedidos_balcao(status);
CREATE INDEX idx_pedidos_balcao_created_at ON public.pedidos_balcao(created_at DESC);
CREATE INDEX idx_pedidos_balcao_itens_pedido_id ON public.pedidos_balcao_itens(pedido_id);
CREATE INDEX idx_pedidos_balcao_itens_produto_id ON public.pedidos_balcao_itens(produto_id);

-- Function to update order total
CREATE OR REPLACE FUNCTION update_pedido_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.pedidos_balcao
  SET 
    total = (
      SELECT COALESCE(SUM(subtotal), 0)
      FROM public.pedidos_balcao_itens
      WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update order total when items change
CREATE TRIGGER trigger_update_pedido_total
AFTER INSERT OR UPDATE OR DELETE ON public.pedidos_balcao_itens
FOR EACH ROW
EXECUTE FUNCTION update_pedido_total();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on pedidos_balcao
CREATE TRIGGER trigger_update_pedidos_balcao_updated_at
BEFORE UPDATE ON public.pedidos_balcao
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.pedidos_balcao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_balcao_itens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pedidos_balcao
CREATE POLICY "Allow all operations on pedidos_balcao"
  ON public.pedidos_balcao
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for pedidos_balcao_itens
CREATE POLICY "Allow all operations on pedidos_balcao_itens"
  ON public.pedidos_balcao_itens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.pedidos_balcao TO anon, authenticated;
GRANT ALL ON public.pedidos_balcao_itens TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.pedidos_balcao IS 'Tabela principal de pedidos do balcão';
COMMENT ON TABLE public.pedidos_balcao_itens IS 'Itens individuais de cada pedido';
COMMENT ON COLUMN public.pedidos_balcao.total IS 'Total calculado automaticamente pela soma dos itens';
COMMENT ON COLUMN public.pedidos_balcao_itens.subtotal IS 'Subtotal do item (produto_preco * quantidade)';
