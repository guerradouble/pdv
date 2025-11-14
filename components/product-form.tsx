"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Settings2 } from "lucide-react"
import type { Product } from "@/types/product"
import { TypeManagerModal } from "./type-manager-modal"
import { useProductTypes } from "@/hooks/use-product-types"
import { cadastrarProdutoWebHook, editarProdutoWebHook } from "@/app/actions/n8n-actions"

interface ProductFormProps {
  product?: Product | null
  onClose: () => void
  onRefresh?: () => void
}

export function ProductForm({ product, onClose, onRefresh }: ProductFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    preco: "",
    ingredientes: "",
    // 🔥 sempre "cozinha"
    local_preparo: "cozinha",
  })

  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false)
  const { types, isLoading, addType, deleteType } = useProductTypes()

  useEffect(() => {
    if (product) {
      setFormData({
        nome: product.nome,
        tipo: product.tipo,
        preco: product.preco.toString().replace(".", ","),
        ingredientes: product.ingredientes || "",
        // 🔥 força "cozinha" sempre
        local_preparo: product.local_preparo || "cozinha",
      })
    } else if (types.length > 0 && !formData.tipo) {
      setFormData((prev) => ({ ...prev, tipo: types[0] }))
    }
  }, [product, types])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.nome.trim()) return alert("Preencha o nome do produto")
    if (!formData.tipo) return alert("Selecione um tipo")
    if (!formData.preco || Number(formData.preco.replace(",", ".")) <= 0) {
      return alert("Preço inválido")
    }

    const payload = {
      ...(product && { id: product.id }),
      nome: formData.nome.trim(),
      tipo: formData.tipo,
      preco: Number(formData.preco.replace(",", ".")),
      ingredientes: formData.ingredientes.trim() || null,

      // 🔥 SEMPRE "cozinha", independente do usuário
      local_preparo: "cozinha",

      disponivel: product?.disponivel ?? true,
    }

    if (product) {
      await editarProdutoWebHook(payload)
    } else {
      await cadastrarProdutoWebHook(payload)
    }

    onClose()
    onRefresh?.()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">
              {product ? "Editar Produto" : "Adicionar Produto"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Nome */}
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tipo *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTypeManagerOpen(true)}
                  className="gap-1 h-8 px-2 text-xs"
                >
                  <Settings2 className="h-3 w-3" /> Editar Tipo
                </Button>
              </div>

              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>

                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label>Preço (R$) *</Label>
              <Input
                type="text"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              />
            </div>

            {/* Ingredientes */}
            <div className="space-y-2">
              <Label>Ingredientes</Label>
              <Textarea
                value={formData.ingredientes}
                onChange={(e) => setFormData({ ...formData, ingredientes: e.target.value })}
                rows={3}
              />
            </div>

            {/* 🔥 CAMPO REMOVIDO: Local de preparo */}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {product ? "Salvar" : "Adicionar"}
              </Button>
            </div>

          </form>
        </div>
      </div>

      {isTypeManagerOpen && (
        <TypeManagerModal
          types={types}
          onClose={() => setIsTypeManagerOpen(false)}
          onAddType={addType}
          onDeleteType={deleteType}
          isLoading={isLoading}
        />
      )}
    </>
  )
}
