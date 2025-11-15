"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, ArrowLeft } from "lucide-react"
import { ProductForm } from "@/components/product-form"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/types/product"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { deletarProdutoWebHook } from "@/app/actions/n8n-actions"
import Link from "next/link"

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
  }, [])

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      await deletarProdutoWebHook(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error("Erro ao deletar produto via webhook:", err)
    }
  }

  return (
    <div className="p-4 space-y-4">
      
      {/* HEADER AJUSTADO — exatamente como solicitado */}
      <Card className="p-3 flex items-center justify-between">
        
        {/* Botão VOLTAR — canto esquerdo */}
        <Link href="/" className="mr-4">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        {/* Botão NOVO PRODUTO — centralizado entre Voltar e o Título */}
        <Button
          className="mx-auto"
          onClick={() => {
            setEditingProduct(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo produto
        </Button>

        {/* Título — agora maior e alinhado à direita */}
        <h1 className="text-3xl font-bold text-right whitespace-nowrap">
          Cadastro de Produtos
        </h1>
        
      </Card>

      {/* LISTA — não alterada */}
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

      {/* MODAL — intacto */}
      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setIsFormOpen(false)
            setEditingProduct(null)
            loadProducts()
          }}
        />
      )}
    </div>
  )
}
