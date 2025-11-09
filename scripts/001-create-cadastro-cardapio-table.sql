-- Create the Cadastro_Cardapio table for storing menu items
CREATE TABLE IF NOT EXISTS "Cadastro_Cardapio" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Hambúrguer', 'Bebida', 'Molho')),
  preco DECIMAL(10, 2) NOT NULL,
  descricao TEXT,
  disponivel BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on tipo for faster filtering
CREATE INDEX IF NOT EXISTS idx_cadastro_cardapio_tipo ON "Cadastro_Cardapio"(tipo);

-- Create an index on disponivel for faster filtering
CREATE INDEX IF NOT EXISTS idx_cadastro_cardapio_disponivel ON "Cadastro_Cardapio"(disponivel);
