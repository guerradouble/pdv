"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, X } from "lucide-react"
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
  const [addItems, setAddItems] = useState<OrderFormItem[]>([])

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
      toast({
        title: "✅ Pedido criado!",
        description: "O pedido foi registrado e enviado para os setores correspondentes.",
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "❌ Erro ao registrar pedido",
        description: "Tente novamente em alguns segundos.",
      })
    }
  }

  // ---------- 🔹 Adicionar itens a um pedido existente ----------
  const handleAddItems = async (pedidoId: string, items: OrderFormItem[]) => {
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

      toast({
        title: "Itens adicionados!",
        description: "Os novos produtos foram enviados aos setores correspondentes.",
      })
      setOpenAddModal(false)
      setSelectedOrder(null)
      setAddItems([])
      await loadOrders()
    } catch (err) {
      console.error(err)
      toast({
        title: "Erro ao adicionar itens",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      })
    }
  }

  // ---------- 🔹 Finalizar comanda ----------
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
      toast({
        title: "Erro ao finalizar comanda",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      })
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
        <OrderForm products={products} onSubmit={handleAddOrder} />

        {/* Pedidos ativos */}
        <OrderList
          orders={orders}
          onAddItems={(order) => {
            setSelectedOrder(order)
            setOpenAddModal(true)
          }}
          onFinalize={handleFinalizeOrder}
        />
      </main>

      {/* Modal adicionar itens */}
      {openAddModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 relative">
            <button className="absolute right-4 top-4" onClick={() => setOpenAddModal(false)}>
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-2">
              Adicionar Itens — {selectedOrder.nome_cliente} {selectedOrder.mesa ? `(Mesa ${selectedOrder.mesa})` : ""}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Escolha os itens do cardápio e confirme para inserir na mesma comanda.</p>

            <InlineAddItem
              products={products}
              onAdd={(it) => setAddItems((prev) => [...prev, it])}
            />

            {addItems.length > 0 && (
              <div className="mt-4 border rounded p-3">
                <div className="text-sm font-medium mb-2">Itens a adicionar</div>
                <ul className="text-sm list-disc ml-4 space-y-1">
                  {addItems.map((i, idx) => (
                    <li key={idx}>
                      {i.quantidade}× {i.produto_nome} — R$ {(Number(i.produto_preco) * Number(i.quantidade)).toFixed(2)} [{i.local_preparo}]
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenAddModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleAddItems(selectedOrder.id, addItems)}>
                Confirmar inclusão
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

/** Mini-form para adicionar um item rapidamente */
function InlineAddItem({ products, onAdd }: { products: Product[], onAdd: (it: OrderFormItem) => void }) {
  const [p, setP] = useState<Product | null>(null)
  const [qtd, setQtd] = useState(1)
  const [local, setLocal] = useState<"balcao" | "cozinha">("balcao")

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <select
        className="border rounded px-3 py-2"
        value={p?.id || ""}
        onChange={(e) => {
          const found = products.find((x) => x.id === e.target.value) || null
          setP(found)
        }}
      >
        <option value="">Selecione um produto</option>
        {products.map((prod) => (
          <option key={prod.id} value={prod.id}>
            {prod.nome} — R$ {Number((prod as any).preco || prod.preco).toFixed(2)}
          </option>
        ))}
      </select>

      <input
        type="number"
        min={1}
        value={qtd}
        onChange={(e) => setQtd(Number(e.target.value || 1))}
        className="border rounded px-3 py-2"
      />

      <select className="border rounded px-3 py-2" value={local} onChange={(e) => setLocal(e.target.value as any)}>
        <option value="balcao">Balcão</option>
        <option value="cozinha">Cozinha</option>
      </select>

      <Button
        onClick={() => {
          if (!p) return
          onAdd({
            produto_id: p.id,
            produto_nome: p.nome,
            produto_preco: Number((p as any).preco || p.preco),
            quantidade: qtd,
            local_preparo: local,
          })
          setP(null)
          setQtd(1)
          setLocal("balcao")
        }}
      >
        <Plus className="h-4 w-4 mr-1" /> Adicionar
      </Button>
    </div>
  )
}
