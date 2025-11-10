"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, UtensilsCrossed, Store } from "lucide-react"
import type { Product } from "@/types/product"
import { useTransition } from "react"
import { toggleDisponibilidadeWebHook } from "@/app/actions/n8n-actions"

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onRefresh: () => void
}

export function ProductCard({ product, onEdit, onDelete, onRefresh }: ProductCardProps) {
  const isCozinha = product.local_preparo === "cozinha"
  const [isPending, startTransition] = useTransition()

  async function handleToggle() {
    startTransition(async () => {
      await toggleDisponibilidadeWebHook(product.id, !product.disponivel)
      onRefresh()
    })
  }

  const precoFormatado = `R$ ${Number(product.preco).toFixed(2).replace(".", ",")}` // ✅ SEM /100

  return (
    <Card className="p-4 flex flex-col gap-3 border border-border bg-card/60 hover:bg-card/80 transition rounded-lg">

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{product.nome}</h3>
        <span className="text-sm font-medium text-primary">{precoFormatado}</span>
      </div>

      <p className="text-sm text-muted-foreground">{product.tipo}</p>

      <div className={`text-xs font-semibold w-fit px-2 py-1 rounded-md flex items-center gap-1 border
        ${isCozinha 
          ? "bg-orange-500/15 text-orange-300 border-orange-500/40" 
          : "bg-blue-500/15 text-blue-300 border-blue-500/40"
        }`}
      >
        {isCozinha ? (
          <>
            <UtensilsCrossed className="h-3 w-3" /> Cozinha
          </>
        ) : (
          <>
            <Store className="h-3 w-3" /> Balcão
          </>
        )}
      </div>

      {product.ingredientes && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {product.ingredientes}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">

        <Button
          size="sm"
          disabled={isPending}
          variant={product.disponivel ? "default" : "destructive"}
          onClick={handleToggle}
          className="text-xs"
        >
          {product.disponivel ? "Disponível" : "Em Falta"}
        </Button>

        <div className="flex gap-2">
          <Button size="icon" variant="outline" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="hover:bg-destructive hover:text-white transition"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
