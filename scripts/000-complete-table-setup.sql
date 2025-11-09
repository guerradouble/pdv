-- Complete SQL script to create cadastro_cardapio table
-- Run this script in a fresh Supabase project to set up the entire structure

-- Step 1: Create the enum type for product types
CREATE TYPE public.tipo_produto AS ENUM (
    'Hambúrguer',
    'Bebida',
    'Molho'
);

-- Step 2: Create the main table
CREATE TABLE public.cadastro_cardapio (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo public.tipo_produto NOT NULL,
    preco DECIMAL(10, 2) NOT NULL CHECK (preco >= 0),
    ingredientes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 3: Enable Row Level Security
ALTER TABLE public.cadastro_cardapio ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies to allow all operations
-- Policy for SELECT (read)
CREATE POLICY "Allow public read access" 
ON public.cadastro_cardapio 
FOR SELECT 
USING (true);

-- Policy for INSERT (create)
CREATE POLICY "Allow public insert access" 
ON public.cadastro_cardapio 
FOR INSERT 
WITH CHECK (true);

-- Policy for UPDATE (edit)
CREATE POLICY "Allow public update access" 
ON public.cadastro_cardapio 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Policy for DELETE (remove)
CREATE POLICY "Allow public delete access" 
ON public.cadastro_cardapio 
FOR DELETE 
USING (true);

-- Step 5: Create indexes for better performance
CREATE INDEX idx_cadastro_cardapio_tipo ON public.cadastro_cardapio(tipo);
CREATE INDEX idx_cadastro_cardapio_created_at ON public.cadastro_cardapio(created_at DESC);

-- Optional: Add a comment to the table
COMMENT ON TABLE public.cadastro_cardapio IS 'Tabela para cadastro de produtos do cardápio';
