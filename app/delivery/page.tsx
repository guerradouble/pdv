"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Truck, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface DeliveryOrder {
  id: string
  cliente_nome: string
  cliente_telefone: string
  endereco: string
  numero_pedido: string
  status: "pendente" | "em_preparo" | "saiu_para_entrega" | "finalizado"
  valor_total: number
  produtos: unknown[]
  descricao: string | null
  created_at: string
  saiu_para_entrega_em: string | null
  finalizado_em: string | null
}

interface ParsedProduto {
  quantidade: number
  nome: string
}

export default function DeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("novos")

  const supabase = getSupabaseBrowserClient()
  const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

  useEffect(() => {
    loadOrders()

    const channel = supabase
      .channel("pedidos_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
        },
        () => {
          loadOrders()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setOrders(data || [])
    } catch (err) {
      console.error("Error loading delivery orders:", err)
      setError("Erro ao carregar pedidos de delivery")
    } finally {
      setIsLoading(false)
    }
  }

  const parseProdutosString = (produtosData: unknown): ParsedProduto[] => {
    if (!produtosData) return []

    // Se já for array, retornar como está
    if (Array.isArray(produtosData)) {
      return produtosData.map((p: any) => {
        if (typeof p === "string") {
          return parseProductString(p)
        }
        return p
      })
    }

    // Se for string, fazer split por quebras de linha ou separadores
    if (typeof produtosData === "string") {
      if (!produtosData.trim()) return []

      // Tentar fazer split por quebras de linha ou ponto-e-vírgula
      const items = produtosData.split(/[\n;]/).filter((item) => item.trim())
      return items.map((item) => parseProductString(item))
    }

    return []
  }

  const parseProductString = (productStr: string): ParsedProduto => {
    // Formato esperado: "2× X‑Tudo Tradicional" ou "2x X‑Tudo Tradicional"
    const match = productStr.match(/^(\d+)\s*[×x]\s*(.+)$/)

    if (match) {
      return {
        quantidade: Number.parseInt(match[1], 10),
        nome: match[2].trim(),
      }
    }

    // Fallback: tentar extrair apenas um número no início
    const numberMatch = productStr.match(/^(\d+)\s+(.+)$/)
    if (numberMatch) {
      return {
        quantidade: Number.parseInt(numberMatch[1], 10),
        nome: numberMatch[2].trim(),
      }
    }

    // Último fallback: retornar tudo como nome com quantidade 1
    return {
      quantidade: 1,
      nome: productStr.trim(),
    }
  }

  const sendWebhook = async (status: string, pedidoId: string) => {
    if (!n8nWebhookUrl) {
      console.warn("N8N_WEBHOOK_URL não configurado. Pulando webhook.")
      return
    }

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_id: pedidoId,
          status: status,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        console.error("Webhook error status:", response.status, response.statusText)
        return
      }

      try {
        const responseData = await response.json()
        console.log("Webhook response:", responseData)
      } catch (parseError) {
        console.warn("Webhook retornou resposta não-JSON (isso é ok):", response.statusText)
      }
    } catch (err) {
      console.error("Error sending webhook:", err)
    }
  }

  const handleSaiuParaEntrega = async (orderId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("pedidos")
        .update({
          status: "saiu_para_entrega",
          saiu_para_entrega_em: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (updateError) throw updateError

      await sendWebhook("saiu_para_entrega", orderId)
      await loadOrders()
      alert("Pedido marcado como saído para entrega!")
    } catch (err) {
      console.error("Error updating order status:", err)
      alert("Erro ao atualizar status. Tente novamente.")
    }
  }

  const handleFinalizar = async (orderId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("pedidos")
        .update({
          status: "finalizado",
          finalizado_em: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (updateError) throw updateError

      await sendWebhook("finalizado", orderId)
      await loadOrders()
      alert("Pedido finalizado com sucesso!")
    } catch (err) {
      console.error("Error finalizing order:", err)
      alert("Erro ao finalizar pedido. Tente novamente.")
    }
  }

  const novosPedidos = orders.filter((o) => o.status === "pendente" || o.status === "em_preparo")
  const saindoParaEntrega = orders.filter((o) => o.status === "saiu_para_entrega")
  const finalizados = orders.filter((o) => o.status === "finalizado")

  const renderOrderCard = (order: DeliveryOrder, showSaiuButton?: boolean, showFinalizarButton?: boolean) => {
    const produtosParsed = parseProdutosString(order.produtos)

    return (
      <Card key={order.id} className="p-6 hover:shadow-md transition-shadow">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Número do Pedido: <span className="font-bold">#{order.numero_pedido}</span>
              </p>
              <p className="text-lg font-bold text-foreground">Cliente: {order.cliente_nome}</p>
            </div>
            <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {order.status === "pendente" || order.status === "em_preparo"
                ? "Preparando"
                : order.status === "saiu_para_entrega"
                  ? "Em Rota"
                  : "Entregue"}
            </span>
          </div>

          {produtosParsed.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-semibold text-foreground">Produtos:</p>
              <div className="space-y-1.5 pl-4">
                {produtosParsed.map((produto: ParsedProduto, idx: number) => (
                  <div key={idx} className="text-sm text-muted-foreground">
                    <span>
                      • {produto.quantidade} × {produto.nome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm border-t pt-4">
            <p>
              <span className="text-muted-foreground">Endereço:</span> {order.endereco}
            </p>
            {order.descricao && (
              <p>
                <span className="text-muted-foreground">Forma de Pagamento:</span> {order.descricao}
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-lg font-bold text-foreground">Valor Total: R$ {order.valor_total.toFixed(2)}</p>
          </div>

          <div className="flex gap-2 pt-4">
            {showSaiuButton && (
              <Button
                onClick={() => handleSaiuParaEntrega(order.id)}
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Truck className="h-4 w-4" />
                Saiu para Entrega
              </Button>
            )}
            {showFinalizarButton && (
              <Button
                onClick={() => handleFinalizar(order.id)}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Delivery</h1>
                <p className="text-muted-foreground mt-1">Acompanhamento de pedidos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <Card className="p-6 mb-6 border-destructive bg-destructive/10">
            <p className="text-destructive font-medium">{error}</p>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-muted-foreground">Carregando pedidos...</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="novos" className="gap-2">
                <Clock className="h-4 w-4" />
                Novos ({novosPedidos.length})
              </TabsTrigger>
              <TabsTrigger value="saindo" className="gap-2">
                <Truck className="h-4 w-4" />
                Saiu ({saindoParaEntrega.length})
              </TabsTrigger>
              <TabsTrigger value="finalizados" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Finalizados ({finalizados.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="novos" className="space-y-4">
              {novosPedidos.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">Nenhum pedido novo no momento</p>
                </Card>
              ) : (
                novosPedidos.map((order) => renderOrderCard(order, true, false))
              )}
            </TabsContent>

            <TabsContent value="saindo" className="space-y-4">
              {saindoParaEntrega.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">Nenhum pedido em rota</p>
                </Card>
              ) : (
                saindoParaEntrega.map((order) => renderOrderCard(order, false, true))
              )}
            </TabsContent>

            <TabsContent value="finalizados" className="space-y-4">
              {finalizados.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">Nenhum pedido finalizado</p>
                </Card>
              ) : (
                finalizados.map((order) => renderOrderCard(order, false, false))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
