-- Create pedidos table for delivery orders from WhatsApp/n8n
create table if not exists public.pedidos (
  id uuid not null default gen_random_uuid (),
  cliente_nome character varying(255) not null,
  cliente_telefone character varying(20) not null,
  produtos jsonb not null,
  valor_total numeric(10, 2) not null,
  descricao text null,
  endereco text null,
  status character varying(50) null default 'pendente'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  em_preparo_em timestamp with time zone null,
  saiu_para_entrega_em timestamp with time zone null,
  finalizado_em timestamp with time zone null,
  numero_pedido character varying(20) not null,
  constraint pedidos_pkey primary key (id),
  constraint pedidos_numero_pedido_unique unique (numero_pedido),
  constraint pedidos_status_check check (
    (
      (status)::text = any (
        array[
          ('pendente'::character varying)::text,
          ('em_preparo'::character varying)::text,
          ('saiu_para_entrega'::character varying)::text,
          ('finalizado'::character varying)::text
        ]
      )
    )
  )
) tablespace pg_default;

-- Create indexes
create index if not exists idx_pedidos_status on public.pedidos using btree (status) tablespace pg_default;
create index if not exists idx_pedidos_created_at on public.pedidos using btree (created_at desc) tablespace pg_default;
create index if not exists idx_pedidos_telefone on public.pedidos using btree (cliente_telefone) tablespace pg_default;

-- Create trigger function for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger
create trigger update_pedidos_updated_at before update on pedidos
for each row
execute function update_updated_at_column();
