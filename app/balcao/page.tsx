// app/balcao/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { OrderForm } from "@/components/order-form"
import { OrderList } from "@/components/order-list"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Product } from "@/types/product"
import type { Order, OrderFormData } from "@/types/order"

export default function BalcaoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadProducts()
    loadOrders()

    const ordersChannel = supabase
      .channel("pedidos_balcao_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos_balcao" }, () => loadOrders())
      .subscribe()

    const productsChannel = supabase
      .channel("cadastro_cardapio_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cadastro_cardapio" }, () => loadProducts())
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(productsChannel)
    }
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("cadastro_cardapio")
        .select("*")
        .eq("disponivel", true)
        .order("nome", { ascending: true })
      if (fetchError) throw fetchError
      setProducts((data || []) as Product[])
    } catch (err) {
      console.error("Error loading products:", err)
      setError("Erro ao carregar produtos")
    }
  }

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("pedidos_balcao")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setOrders((data || []) as Order[])
    } catch (err) {
      console.error("Error loading orders:", err)
      setError("Erro ao carregar pedidos")
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Agora o PDV chama um API Route (server-side) em vez de importar Server Action no client
  const handleAddOrder = async (orderData: OrderFormData) => {
    try {
      const res = await fetch("/api/n8n/balcao-criar-pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_cliente: orderData.nome_cliente?.trim() || "Balcão",
          telefone: orderData.telefone || null,
          mesa: orderData.mesa || null,
          canal: "balcao",
          items: (orderData.items || []).map((it) => ({
            produto_id: it.produto_id,
            produto_nome: it.produto_nome,
            produto_preco: Number(it.produto_preco),
            quantidade: Number(it.quantidade),
          })),
        }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`Falha ao criar pedido (${res.status}): ${txt}`)
      }

      await loadOrders()
    } catch (err) {
      console.error(err)
      alert("Erro ao registrar pedido.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="text-xl font-semibold">Balcão</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <OrderForm products={products} onSubmit={handleAddOrder} />
        {isLoading ? (
          <p className="text-center text-muted-foreground">Carregando pedidos...</p>
        ) : (
          <OrderList
            orders={orders}
            onMarkAsReady={async (id) => {
              await supabase.from("pedidos_balcao").update({ status: "pronto" }).eq("id", id)
              loadOrders()
            }}
          />
        )}
      </main>
    </div>
  )
}
