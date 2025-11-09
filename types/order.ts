export type StatusPedido = "pendente" | "pronto" | "cancelado"

export interface Order {
  id: string
  nome_cliente: string
  telefone: string | null
  mesa: string | null
  status: string
  total: number
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  pedido_id: string
  produto_id: string
  produto_nome: string
  produto_preco: number
  quantidade: number
  subtotal: number
  created_at: string
}

export interface OrderFormData {
  nome_cliente: string
  telefone?: string
  mesa?: string
  items: OrderFormItem[]
  tipo: "balcao" | "delivery"
}

export interface OrderFormItem {
  produto_id: string
  produto_nome: string
  produto_preco: number
  quantidade: number
}
