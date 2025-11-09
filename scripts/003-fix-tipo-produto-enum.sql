-- Fix the tipo_produto enum to match the application values
-- This script handles the enum mismatch causing the 400 error

-- First, check if the enum exists and drop it if needed
DO $$ 
BEGIN
    -- If the column is using an enum, we need to change it to text first
    IF EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'tipo_produto'
    ) THEN
        -- Change column to text temporarily
        ALTER TABLE cadastro_cardapio 
        ALTER COLUMN tipo TYPE TEXT;
        
        -- Drop the old enum
        DROP TYPE IF EXISTS tipo_produto;
    END IF;
END $$;

-- Create the enum with the correct values matching the form
CREATE TYPE tipo_produto AS ENUM ('Hambúrguer', 'Bebida', 'Molho');

-- Update the column to use the new enum
ALTER TABLE cadastro_cardapio 
ALTER COLUMN tipo TYPE tipo_produto USING tipo::tipo_produto;

-- Verify the change
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'cadastro_cardapio' AND column_name = 'tipo';
