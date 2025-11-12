"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, Minus, X } from "lucide-react"
import Link from "next/link"
import { OrderForm } from "@/components/order-form"
import { OrderList } from "@/components/order-list"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Product } from "@/types/product"
import type { Order, OrderFormData, OrderFormItem } from "@/types/order"
import { toast } from "@/components/ui/use-toast"

export default function BalcaoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openAddModal, setOpenAddModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [pendingItems, setPendingItems] = useState<OrderFormItem[]>([]) // itens selecionados no modal

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadProducts()
    loadOrders()

    const ordersChannel = supabase
      .channel("pedidos_balcao_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos_balcao" }, () => loadOrders())
      .subscribe()

    const itensChannel = supabase
      .channel("pedidos_balcao_itens_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos_balcao_itens" }, () => loadOrders())
      .subscribe()

    const cozinhaChannel = supabase
      .channel("cozinha_to_balcao_status")
      .on("postgres_changes", { event: "*", schema: "public", table: "cozinha_itens" }, (payload) => {
        const item = payload.new
        if (!item) return
        if (item.status === "em_preparo") {
          toast({ title: "🟡 Em Preparo", description: `${item.produto_nome} (Mesa ${item.mesa ?? "Balcão"}) está sendo preparado.` })
        }
        if (item.status === "pronto") {
          toast({ title: "🟢 Pronto!", description: `${item.produto_nome} (Mesa ${item.mesa ?? "Balcão"}) está pronto para servir.` })
        }
      })
      .subscribe()

    const productsChannel = supabase
      .channel("cadastro_cardapio_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cadastro_cardapio" }, () => loadProducts())
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(itensChannel)
      supabase.removeChannel(cozinhaChannel)
      supabase.removeChannel(productsChannel)
    }
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("cadastro_cardapio")
        .select("*")
        .eq("disponivel", true)
        .order("grupo", { ascending: true })
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
        .select(`
          *,
          items:pedidos_balcao_itens (
            id,
            pedido_id,
            produto_id,
            produto_nome,
            produto_preco,
            quantidade,
            subtotal,
            local_preparo,
            created_at
          )
        `)
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

  // Cria comanda nova (usa seu fluxo n8n atual)
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
        throw new Error(`Falha ao criar pedido (${res.status}): ${txt}`)
      }

      await loadOrders()
      toast({ title: "✅ Pedido criado!", description: "O pedido foi registrado e enviado para os setores correspondentes." })
    } catch (err) {
      console.error(err)
      toast({ title: "❌ Erro ao registrar pedido", description: "Tente novamente em alguns segundos." })
    }
  }

  // Adiciona itens em comanda existente
  const handleAddItems = async (pedidoId: string, items: OrderFormItem[]) => {
    if (!items.length) {
      toast({ title: "Nada a adicionar", description: "Selecione pelo menos um item." })
      return
    }
    try {
      const res = await fetch("/api/n8n/balcao-adicionar-itens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId, items }),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`Falha ao adicionar itens (${res.status}): ${txt}`)
      }

      toast({ title: "Itens adicionados!", description: "Os novos produtos foram enviados aos setores correspondentes." })
      setOpenAddModal(false)
      setSelectedOrder(null)
      setPendingItems([])
      await loadOrders()
    } catch (err) {
      console.error(err)
      toast({ title: "Erro ao adicionar itens", description: "Tente novamente em alguns segundos.", variant: "destructive" })
    }
  }

  // Finaliza comanda
  const handleFinalizeOrder = async (pedidoId: string) => {
    const confirmClose = window.confirm("Deseja realmente finalizar esta comanda?")
    if (!confirmClose) return
    try {
      const res = await fetch("/api/n8n/balcao-finalizar-comanda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`Falha ao finalizar (${res.status}): ${txt}`)
      }
      toast({ title: "✅ Comanda finalizada!" })
      await loadOrders()
    } catch (err) {
      console.error(err)
      toast({ title: "Erro ao finalizar comanda", description: "Tente novamente em alguns segundos.", variant: "destructive" })
    }
  }

  if (isLoading) return <p className="text-center mt-10">Carregando pedidos...</p>
  if (error) return <p className="text-center text-destructive">{error}</p>

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
        {/* Criar nova comanda */}
        <Card className="p-6">
          <OrderForm products={products} onSubmit={handleAddOrder} />
        </Card>

        {/* Pedidos ativos */}
        <OrderList
          orders={orders}
          onAddItems={(order) => {
            setSelectedOrder(order)
            setPendingItems([])
            setOpenAddModal(true)
          }}
          onFinalize={handleFinalizeOrder}
        />
      </main>

      {/* Modal adicionar itens via cardápio agrupado */}
      {openAddModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-5xl p-6 relative">
            <button className="absolute right-4 top-4" onClick={() => setOpenAddModal(false)}>
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-semibold mb-2">
              Adicionar Itens — {selectedOrder.nome_cliente} {selectedOrder.mesa ? `(Mesa ${selectedOrder.mesa})` : ""}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Toque em “Adicionar” para incluir rapidamente. O destino (cozinha/balcão) é automático conforme o cardápio.
            </p>

            <CatalogAddItems
              products={products}
              pendingItems={pendingItems}
              setPendingItems={setPendingItems}
            />

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenAddModal(false)}>Cancelar</Button>
              <Button onClick={() => handleAddItems(selectedOrder.id, pendingItems)}>Confirmar inclusão</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

/**
 * Catálogo agrupado por grupo, com botões “Adicionar” por produto.
 * O local_preparo vem do próprio produto (sem escolha manual).
 */
function CatalogAddItems({
  products,
  pendingItems,
  setPendingItems,
}: {
  products: Product[]
  pendingItems: OrderFormItem[]
  setPendingItems: (items: OrderFormItem[]) => void
}) {
  // Agrupa por grupo
  const byGroup = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const p of products) {
      const g = p.grupo || "Outros"
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(p)
    }
    // ordena produtos por nome dentro do grupo (já vem ordenado, mas garantimos)
    for (const [, arr] of map) arr.sort((a, b) => a.nome.localeCompare(b.nome))
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])) // ordena grupos
  }, [products])

  const add = (prod: Product) => {
    const idx = pendingItems.findIndex((i) => i.produto_id === prod.id)
    if (idx >= 0) {
      const clone = [...pendingItems]
      clone[idx] = { ...clone[idx], quantidade: clone[idx].quantidade + 1 }
      setPendingItems(clone)
    } else {
      setPendingItems([
        ...pendingItems,
        {
          produto_id: prod.id,
          produto_nome: prod.nome,
          produto_preco: Number(prod.preco),
          quantidade: 1,
          local_preparo: prod.local_preparo as "balcao" | "cozinha",
        },
      ])
    }
  }

  const dec = (prodId: string) => {
    const idx = pendingItems.findIndex((i) => i.produto_id === prodId)
    if (idx < 0) return
    const clone = [...pendingItems]
    const q = clone[idx].quantidade - 1
    if (q <= 0) {
      clone.splice(idx, 1)
    } else {
      clone[idx] = { ...clone[idx], quantidade: q }
    }
    setPendingItems(clone)
  }

  const totalParcial = useMemo(
    () => pendingItems.reduce((acc, it) => acc + Number(it.produto_preco) * Number(it.quantidade), 0),
    [pendingItems]
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Lista agrupada */}
      <div className="xl:col-span-2 space-y-4 max-h-[60vh] overflow-auto pr-2">
        {byGroup.map(([grupo, arr]) => (
          <Card key={grupo} className="p-4">
            <div className="mb-3 font-semibold">{grupo}</div>
            <div className="divide-y">
              {arr.map((p) => {
                const current = pendingItems.find((i) => i.produto_id === p.id)
                return (
                  <div key={p.id} className="py-2 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.local_preparo === "cozinha" ? "Cozinha" : "Balcão"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold">R$ {Number(p.preco).toFixed(2)}</div>
                      <div className="flex items-center gap-2">
                        {current && (
                          <Button size="icon" variant="outline" onClick={() => dec(p.id)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button onClick={() => add(p)}>
                          <Plus className="h-4 w-4 mr-1" /> Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Resumo rápido */}
      <Card className="p-4 h-fit xl:sticky xl:top-0">
        <div className="font-semibold mb-3">Resumo (pré-inclusão)</div>
        {pendingItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum item selecionado.</div>
        ) : (
          <>
            <ul className="text-sm space-y-2 max-h-[40vh] overflow-auto pr-1">
              {pendingItems.map((i) => (
                <li key={i.produto_id} className="flex justify-between gap-3">
                  <span className="truncate">{i.quantidade}× {i.produto_nome}</span>
                  <span>R$ {(Number(i.produto_preco) * Number(i.quantidade)).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between font-semibold">
              <span>Total parcial</span>
              <span>R$ {totalParcial.toFixed(2)}</span>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
