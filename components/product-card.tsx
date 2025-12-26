"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
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
  const [isPending, startTransition] = useTransition()

  async function handleToggle() {
    startTransition(async () => {
      await toggleDisponibilidadeWebHook({
        id: product.id,
        nome: product.nome,
        tipo: product.tipo,
        preco: product.preco,
        ingredientes: product.ingredientes,
        disponivel: !product.disponivel
      })
      onRefresh()
    })
  }

  return (
    <Card className="p-4 flex justify-between items-center">
      <div>
        <h3 className="font-semibold">{product.nome}</h3>
        <p className="text-sm text-muted-foreground">{product.tipo}</p>
        <p className="text-sm">
          R$ {product.preco.toFixed(2).replace(".", ",")}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={product.disponivel ? "default" : "outline"}
          disabled={isPending}
          onClick={handleToggle}
        >
          {product.disponivel ? "Disponível" : "Indisponível"}
        </Button>

        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => onEdit(product)}
          >
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
