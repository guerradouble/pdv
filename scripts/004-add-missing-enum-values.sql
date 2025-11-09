-- Add missing values to the tipo_produto enum
-- This script safely adds enum values only if they don't already exist

DO $$ 
BEGIN
    -- Add 'Hambúrguer' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Hambúrguer' 
        AND enumtypid = 'public.tipo_produto'::regtype
    ) THEN
        ALTER TYPE public.tipo_produto ADD VALUE 'Hambúrguer';
    END IF;

    -- Add 'Bebida' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Bebida' 
        AND enumtypid = 'public.tipo_produto'::regtype
    ) THEN
        ALTER TYPE public.tipo_produto ADD VALUE 'Bebida';
    END IF;

    -- Add 'Molho' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Molho' 
        AND enumtypid = 'public.tipo_produto'::regtype
    ) THEN
        ALTER TYPE public.tipo_produto ADD VALUE 'Molho';
    END IF;
END $$;

-- Verify the enum values
SELECT enumlabel as valor_enum 
FROM pg_enum 
WHERE enumtypid = 'public.tipo_produto'::regtype
ORDER BY enumsortorder;
