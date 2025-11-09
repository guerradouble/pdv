export interface DeliveryOrder {
  id: string
  cliente_nome: string
  cliente_telefone: string
  produtos: unknown[]
  valor_total: number
  descricao: string | null
  endereco: string | null
  status: "pendente" | "em_preparo" | "saiu_para_entrega" | "finalizado"
  created_at: string
  updated_at: string
  em_preparo_em: string | null
  saiu_para_entrega_em: string | null
  finalizado_em: string | null
  numero_pedido: string
}
