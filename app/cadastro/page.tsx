"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { ProductForm } from "@/components/product-form"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/types/product"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { deletarProdutoWebHook } from "@/app/actions/n8n-actions"

export default function CadastroPage() {
  const supabase = getSupabaseBrowserClient()

  const [products, setProducts] = useState<Product[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function loadProducts() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("cadastro_cardapio")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao carregar produtos:", error)
        return
      }

      setProducts((data ?? []) as Product[])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      // ✅ Regra de negócio:
      // O FRONT **NÃO** deleta no Supabase.
      // Ele só chama o webhook, e o n8n deleta do cardápio + RAG.
      await deletarProdutoWebHook(id)

      // Atualiza localmente para o item sumir da tela na hora,
      // sem depender do timing do n8n.
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error("Erro ao deletar produto via n8n:", err)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <Card className="p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cadastro de Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os itens do cardápio que alimentam o RAG do atendimento.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingProduct(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo produto
        </Button>
      </Card>

      {/* Lista de produtos */}
      <Card className="p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando produtos...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum produto cadastrado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={loadProducts}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Modal de cadastro/edição */}
      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setIsFormOpen(false)
            setEditingProduct(null)
            // Depois de salvar/editar, recarrega do banco (n8n já sincronizou)
            loadProducts()
          }}
        />
      )}
    </div>
  )
}
