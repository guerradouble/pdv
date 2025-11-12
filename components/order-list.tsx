"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, User, Phone, Hash, Plus } from "lucide-react"
import type { Order } from "@/types/order"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OrderListProps {
  orders: Order[]
  onAddItems: (order: Order) => void
  onFinalize: (id: string) => void
}

export function OrderList({ orders, onAddItems, onFinalize }: OrderListProps) {
  const pendingOrders = orders.filter((order) => order.status === "pendente")
  const readyOrders = orders.filter((order) => order.status === "pronto")

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-foreground">Pedidos pendentes</h2>
          <Badge variant="secondary">{pendingOrders.length}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingOrders.map((order) => (
            <Card key={order.id} className="p-4 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pendente</span>
                </div>
                <Badge variant="outline">R$ {Number(order.total || 0).toFixed(2)}</Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{order.nome_cliente}</span>
                </div>
                {order.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{order.telefone}</span>
                  </div>
                )}
                {order.mesa && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Mesa {order.mesa}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => onAddItems(order)}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Itens
                </Button>

                <Button
                  className="w-full gap-2"
                  onClick={() => onFinalize(order.id)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finalizar Pedido
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {readyOrders.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">Pedidos prontos</h2>
            <Badge variant="secondary">{readyOrders.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {readyOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Finalizado</span>
                  </div>
                  <Badge variant="outline">R$ {Number(order.total || 0).toFixed(2)}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
