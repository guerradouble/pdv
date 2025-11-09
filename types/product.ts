export type TipoProduto = string

export interface Product {
  id: string
  tipo: TipoProduto
  nome: string
  preco: number
  ingredientes: string | null
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  tipo: TipoProduto
  nome: string
  preco: number
  ingredientes?: string
}
