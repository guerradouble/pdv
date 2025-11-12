// types/order.ts

export type StatusPedido = "pendente" | "pronto" | "cancelado" | "finalizado"

export interface Order {
  id: string
  nome_cliente: string
  telefone: string | null
  mesa: string | null
  status: StatusPedido
  total: number
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

/** Item dentro de um pedido */
export interface OrderItem {
  id: string
  pedido_id: string
  produto_id: string
  produto_nome: string
  produto_preco: number
  quantidade: number
  subtotal: number
  local_preparo: "balcao" | "cozinha"    // ✅ novo campo importante
  created_at?: string
}

/** Dados para criar um novo pedido via formulário */
export interface OrderFormData {
  nome_cliente: string
  telefone?: string
  mesa?: string
  items: OrderFormItem[]
  tipo?: "balcao" | "delivery"
}

/** Estrutura de item enviada pelo formulário ou modal (antes de salvar no Supabase) */
export interface OrderFormItem {
  produto_id: string
  produto_nome: string
  produto_preco: number
  quantidade: number
  local_preparo?: "balcao" | "cozinha"   // ✅ opcional aqui (vem do produto)
}
