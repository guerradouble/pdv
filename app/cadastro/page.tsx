"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { ProductForm } from "@/components/product-form"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/types/product"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function CadastroPage() {
  const supabase = getSupabaseBrowserClient()

  const [products, setProducts] = useState<Product[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  async function loadProducts() {
    const { data } = await supabase
      .from("cadastro_cardapio")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) setProducts(data as Product[])
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  async function handleDelete(id: string) {
    await supabase.from("cadastro_cardapio").delete().match({ id })
    loadProducts()
  }

  return (
    <div className="p-6 space-y-6">

      {/* ✅ Botão de Voltar Adicionado */}
      <Button variant="outline" size="sm" onClick={() => window.history.back()}>
        ← Voltar
      </Button>

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Cadastro / Produtos</h1>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>

      {/* LISTA DE PRODUTOS */}
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

      {/* MODAL */}
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
