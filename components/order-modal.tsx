"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrderForm } from "@/components/order-form"

export function OrderModal({ order, onClose, onAddItems }) {
  if (!order) return null

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Itens — Mesa {order.mesa}</DialogTitle>
        </DialogHeader>
        <OrderForm onSubmit={onAddItems} />
      </DialogContent>
    </Dialog>
  )
}
