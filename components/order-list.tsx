"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, User, Phone, UtensilsCrossed, Hash } from "lucide-react"
import type { Order } from "@/types/order"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OrderListProps {
  orders: Order[]
  onMarkAsReady: (id: string) => void
}

export function OrderList({ orders, onMarkAsReady }: OrderListProps) {
  const pendingOrders = orders.filter((order) => order.status === "pendente")
  const readyOrders = orders.filter((order) => order.status === "pronto")

  return (
    <div className="space-y-6">
      {/* Pending Orders */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-semibold text-foreground">Pedidos Pendentes</h2>
          <Badge variant="secondary">{pendingOrders.length}</Badge>
        </div>

        {pendingOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum pedido pendente</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} onMarkAsReady={onMarkAsReady} />
            ))}
          </div>
        )}
      </section>

      {/* Ready Orders */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-semibold text-foreground">Pedidos Prontos</h2>
          <Badge variant="secondary">{readyOrders.length}</Badge>
        </div>

        {readyOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum pedido pronto</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyOrders.map((order) => (
              <OrderCard key={order.id} order={order} onMarkAsReady={onMarkAsReady} showMarkButton={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  onMarkAsReady: (id: string) => void
  showMarkButton?: boolean
}

function OrderCard({ order, onMarkAsReady, showMarkButton = true }: OrderCardProps) {
  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        {/* Header with status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">{order.nome_cliente}</span>
          </div>
          <Badge variant={order.status === "pendente" ? "secondary" : "default"} className="capitalize">
            {order.status}
          </Badge>
        </div>

        {/* Phone */}
        {order.telefone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{order.telefone}</span>
          </div>
        )}

        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            <span>Itens do Pedido:</span>
          </div>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-1.5 pl-6">
              {order.items.map((item) => (
                <div key={item.id} className="text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground">{item.produto_nome}</span>
                    <span className="text-muted-foreground whitespace-nowrap">x{item.quantidade}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    R$ {Number(item.produto_preco).toFixed(2)} cada = R$ {Number(item.subtotal).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pl-6">Nenhum item</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-semibold text-foreground">Total:</span>
          <span className="text-lg font-bold text-foreground">R$ {Number(order.total).toFixed(2)}</span>
        </div>

        {/* Table number */}
        {order.mesa && (
          <div className="flex items-center gap-2 text-sm">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{order.mesa}</span>
          </div>
        )}

        {/* Footer with time */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
          </div>
        </div>

        {/* Mark as ready button */}
        {showMarkButton && order.status === "pendente" && (
          <Button onClick={() => onMarkAsReady(order.id)} className="w-full gap-2" variant="default">
            <CheckCircle2 className="h-4 w-4" />
            Marcar como Pronto
          </Button>
        )}
      </div>
    </Card>
  )
}
