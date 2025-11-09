"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, ArrowLeft } from "lucide-react"
import { ProductForm } from "@/components/product-form"
import { ProductCard } from "@/components/product-card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useProductTypes } from "@/hooks/use-product-types"
import type { Product } from "@/types/product"

// ✅ IMPORTS CORRETOS
import {
  cadastrarProdutoWebHook,
  editarProdutoWebHook,
  deletarProdutoWebHook,
} from "@/app/actions/n8n-actions"

export default function CadastroPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()
  const { types } = useProductTypes()

  useEffect(() => {
    loadProducts()
    const channel = supabase
      .channel("cadastro_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cadastro_cardapio" }, () => loadProducts())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("cadastro_cardapio")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch {
      setError("Erro ao carregar produtos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (productData: any) => {
    await cadastrarProdutoWebHook({
      nome: productData.nome,
      tipo: productData.tipo,
      preco: Number(productData.preco), // já em centavos
      ingredientes: productData.ingredientes || null,
      local_preparo: productData.local_preparo,
      disponivel: true,
    })
    setIsFormOpen(false)
    loadProducts()
  }

  const handleEdit = async (productData: any) => {
    await editarProdutoWebHook({
      id: productData.id,
      nome: productData.nome,
      tipo: productData.tipo,
      preco: Number(productData.preco),
      ingredientes: productData.ingredientes || null,
      local_preparo: productData.local_preparo,
      disponivel: productData.disponivel,
    })
    setIsFormOpen(false)
    setEditingProduct(null)
    loadProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return
    await deletarProdutoWebHook({ id }) // ✅ payload correto
    loadProducts()
  }

  const handleToggleDisponivel = async (p: Product) => {
    await editarProdutoWebHook({
      id: p.id,
      nome: p.nome,
      tipo: p.tipo,
      preco: p.preco,
      ingredientes: p.ingredientes,
      local_preparo: p.local_preparo,
      disponivel: !p.disponivel, // ✅ apenas alterna
    })
    loadProducts()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="text-xl font-semibold">Cadastro de Produtos</h1>
          <Button onClick={() => setIsFormOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Carregando…</p>
        ) : error ? (
          <Card className="p-4 text-red-400">{error}</Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => { setEditingProduct(product); setIsFormOpen(true) }}
                onDelete={handleDelete}
                onToggleDisponivel={handleToggleDisponivel}
              />
            ))}
          </div>
        )}
      </main>

      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onSubmit={editingProduct ? handleEdit : handleAdd}
          onClose={() => { setEditingProduct(null); setIsFormOpen(false) }}
        />
      )}
    </div>
  )
}
