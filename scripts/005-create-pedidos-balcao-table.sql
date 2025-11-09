-- Create enum for order status
DO $$ BEGIN
  CREATE TYPE status_pedido AS ENUM ('pendente', 'pronto');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Pedidos_Balcao table
CREATE TABLE IF NOT EXISTS pedidos_balcao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  telefone TEXT,
  produto_id UUID NOT NULL REFERENCES cadastro_cardapio(id) ON DELETE CASCADE,
  produto_nome TEXT NOT NULL,
  produto_preco DECIMAL(10, 2) NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  numero_mesa TEXT,
  status status_pedido NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pedidos_balcao_status ON pedidos_balcao(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_balcao_created_at ON pedidos_balcao(created_at DESC);

-- Enable Row Level Security
ALTER TABLE pedidos_balcao ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on pedidos_balcao" ON pedidos_balcao
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pedidos_balcao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pedidos_balcao_updated_at
  BEFORE UPDATE ON pedidos_balcao
  FOR EACH ROW
  EXECUTE FUNCTION update_pedidos_balcao_updated_at();
