"use client"

import { useState, useEffect, type ChangeEvent } from "react"
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
  const [isUploadingCardapio, setIsUploadingCardapio] = useState(false)

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

  async function uploadCardapio(files: FileList | File[]) {
    const list = Array.from(files)

    setIsUploadingCardapio(true)
    try {
      await Promise.all(
        list.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch(
          "https://n8n.doubleguerra.pro/webhook/cardapio-upload",
          {
            method: "POST",
            body: formData,
          },
        )

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(
            `Falha ao enviar ${file.name} (status ${res.status}): ${text}`,
          )
        }
      }),
      )
      console.log("Imagens do cardápio enviadas com sucesso")
    } catch (error) {
      console.error("Erro ao enviar imagens do cardápio:", error)
      alert("Falha ao enviar imagens do cardápio. Tente novamente.")
    } finally {
      setIsUploadingCardapio(false)
    }
  }

  async function handleCardapioChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    await uploadCardapio(e.target.files)
    e.target.value = ""
  }

  return (
    <div className="p-4 space-y-4">

      {/* ======================= HEADER FINAL ======================= */}
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

        {/* CENTRO – Novo produto */}
        <div className="flex-grow flex justify-center">
          <Button
            onClick={() => {
              setEditingProduct(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>
        </div>

        {/* DIREITA – Título + upload de cardápio */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <h1 className="text-3xl font-bold whitespace-nowrap">
            Cadastro de Produtos
          </h1>

          <div className="flex items-center gap-2">
            <input
              id="cardapio-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleCardapioChange}
            />
            <label htmlFor="cardapio-upload">
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingCardapio}
              >
                {isUploadingCardapio
                  ? "Enviando cardápio..."
                  : "Enviar imagens do cardápio"}
              </Button>
            </label>
          </div>
        </div>

      </Card>
      {/* ======================= FIM DO HEADER ======================= */}

      {/* LISTA – totalmente intacta */}
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

      {/* MODAL – intacto */}
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
