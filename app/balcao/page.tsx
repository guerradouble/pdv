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

// ✅ ALTERADO AQUI
import { enviarItemParaCozinha } from "@/app/actions/n8n-actions"

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

  const handleAddOrder = async (orderData: OrderFormData) => {
    try {
      const { data: pedido, error: pedidoErr } = await supabase
        .from("pedidos_balcao")
        .insert([{ nome_cliente: orderData.nome_cliente || "Balcão", mesa: orderData.mesa || null }])
        .select()
        .single()
      if (pedidoErr || !pedido) throw pedidoErr || new Error("Pedido não criado")

      const itensInsert = orderData.itens.map((item) => ({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        produto_preco: item.produto_preco,
        quantidade: item.quantidade,
        subtotal: item.produto_preco * item.quantidade,
        cliente_nome: orderData.nome_cliente || null,
        mesa: orderData.mesa || null,
      }))
      const { error: itensErr } = await supabase.from("pedidos_balcao_itens").insert(itensInsert)
      if (itensErr) throw itensErr

      for (const it of orderData.itens) {
        await enviarItemParaCozinha({
          pedido_id: pedido.id,
          produto_id: it.produto_id,
          produto_nome: it.produto_nome,
          quantidade: it.quantidade,
          mesa: orderData.mesa || null,
          cliente_nome: orderData.nome_cliente || null,
        })
      }

      alert("Pedido registrado com sucesso!")
      loadOrders()
    } catch (err) {
      console.error("Error adding order:", err)
      alert("Erro ao registrar pedido.")
    }
  }

  const marcarComoPronto = async (id: string) => {
    await supabase.from("pedidos_balcao").update({ status: "pronto" }).eq("id", id)
    loadOrders()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1
