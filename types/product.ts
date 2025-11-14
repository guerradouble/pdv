export type TipoProduto = string

export interface Product {
  id: string
  nome: string
  preco: number
  disponivel: boolean
  descricao?: string | null
  imagem_url?: string | null
  grupo: string
  ingredientes?: string | null
  tipo: string
  created_at?: string
  updated_at?: string
}

export interface ProductFormData {
  tipo: TipoProduto
  nome: string
  preco: number
  ingredientes?: string
}
