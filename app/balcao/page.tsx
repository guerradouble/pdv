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
import { toast } from "@/components/ui/use-toast" // ✅ IMPORT NECESSÁRIO

export default function BalcaoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadProducts()
    loadOrders()

    // ✅ Atualização de pedidos
    const ordersChannel = supabase
      .channel("pedidos_balcao_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos_balcao" }, () => loadOrders())
      .subscribe()

    // ✅ Atualização de produtos do cardápio
    const productsChannel = supabase
      .channel("cadastro_cardapio_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cadastro_cardapio" }, () => loadProducts())
      .subscribe()

    // ✅ ESCUTA DA COZINHA → BALCÃO (PRONTO E EM PREPARO)
    const cozinhaChannel = supabase
      .channel("cozinha_to_balcao_status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cozinha_itens" },
        (payload) => {
          const item = payload.new
          if (!item) return

          if (item.status === "em_preparo") {
            toast({
              title: "🟡 Em Preparo",
              description: `${item.produto_nome} (Mesa ${item.mesa ?? "Balcão"}) está sendo preparado.`,
            })
          }

          if (item.status === "pronto") {
            toast({
              title: "🟢 Pronto!",
              description: `${item.produto_nome} (Mesa ${item.mesa ?? "Balcão"}) está pronto para servir.`,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(productsChannel)
      supabase.removeChannel(cozinhaChannel)
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

  // ✅ Envia local_preparo dentro de cada item para o n8n decidir se vai pra cozinha
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
          items: (orderData.items || []).map((it: any) => ({
            produto_id: it.produto_id,
            produto_nome: it.produto_nome,
            produto_preco: Number(it.produto_preco),
            quantidade: Number(it.quantidade),
            local_preparo: it.local_preparo || "balcao",
          })),
        }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`Falha ao criar pedido (${res.status}): ${txt
