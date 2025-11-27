"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, ArrowLeft, ImageIcon } from "lucide-react"
import { ProductForm } from "@/components/product-form"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/types/product"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { deletarProdutoWebHook } from "@/app/actions/n8n-actions"
import Link from "next/link"
import { CardapioImagesModal } from "@/components/CardapioImagesModal"

export default function CadastroPage() {
  const supabase = getSupabaseBrowserClient()

  const [products, setProducts] = useState<Product[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Modal de imagens do cardápio
  const [isImagesOpen, setIsImagesOpen] = useState(false)

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

      {/* ======================= HEADER ======================= */}
      <Card className="p-3 flex flex-nowrap items-center justify-between">
        
        {/* ESQUERDA – Voltar */}
        <div className="flex-shrink-0">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* CENTRO – Ações */}
        <div className="flex-shrink flex gap-2 items-center">

          {/* Botão novo produto */}
          <Button
            onClick={() => {
              setEditingProduct(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>

          {/* Botão abrir modal de imagens */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsImagesOpen(true)}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Imagens do Cardápio
          </Button>

        </div>

        {/* DIREITA – Título */}
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold whitespace-nowrap">
            Cadastro de Produtos
          </h1>
        </div>

      </Card>
      {/* ======================= FIM DO HEADER ======================= */}

      {/* LISTA – intacta */}
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

      {/* MODAL DE PRODUTOS */}
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

      {/* MODAL DE IMAGENS DO CARDÁPIO */}
      {isImagesOpen && (
        <CardapioImagesModal onClose={() => setIsImagesOpen(false)} />
      )}
    </div>
  )
}
