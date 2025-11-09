-- Fix the table name and column name to match the application code
-- Drop the old table if it exists (with capital C)
DROP TABLE IF EXISTS "Cadastro_Cardapio";

-- Create the table with lowercase name (no quotes needed)
CREATE TABLE IF NOT EXISTS cadastro_cardapio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Hambúrguer', 'Bebida', 'Molho')),
  preco DECIMAL(10, 2) NOT NULL,
  ingredientes TEXT,  -- Changed from 'descricao' to 'ingredientes'
  disponivel BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cadastro_cardapio_tipo ON cadastro_cardapio(tipo);
CREATE INDEX IF NOT EXISTS idx_cadastro_cardapio_disponivel ON cadastro_cardapio(disponivel);

-- Enable Row Level Security (RLS)
ALTER TABLE cadastro_cardapio ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on cadastro_cardapio" 
  ON cadastro_cardapio 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
