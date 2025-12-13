// app/cozinha/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock, UtensilsCrossed, Truck } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { atualizarStatusPedidoWebHook } from "@/lib/n8n"

type StatusPedido = "pendente" | "em_preparo" | "saiu_para_entrega" | "finalizado"
type StatusAcao = "em_preparo" | "saiu_para_entrega" | "finalizado"

type CozinhaPedido = {
  id: string
  numero_pedido: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  produtos: any
  valor_total: number | null
  status: StatusPedido
  created_at: string | null
}

export default function CozinhaPage() {
  const supabase = getSupabaseBrowserClient()
  const [pedidos, setPedidos] = useState<CozinhaPedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function load() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, numero_pedido, cliente_nome, cliente_telefone, produtos, valor_total, status, created_at")
        .in("status", ["pendente", "em_preparo", "saiu_para_entrega"])
        .order("created_at", { ascending: true })

      if (error) throw error

      setPedidos((data || []) as CozinhaPedido[])
    } catch (err) {
      console.error("Erro ao carregar pedidos da cozinha:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel("cozinha_pedidos_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => {
          load()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const agrupado = useMemo(() => {
    return {
      pendentes: pedidos.filter((p) => p.status === "pendente"),
      emPreparo: pedidos.filter((p) => p.status === "em_preparo"),
      saindo: pedidos.filter((p) => p.status === "saiu_para_entrega"),
    }
  }, [pedidos])

  function formatarProdutos(produtos: any): string[] {
    if (!produtos) return []

    if (Array.isArray(produtos)) {
      return produtos.map((p: any) => {
        if (typeof p === "string") return p
        if (p.nome && p.quantidade) return `${p.quantidade}x ${p.nome}`
        if (p.nome) return p.nome
        return JSON.stringify(p)
      })
    }

    if (typeof produtos === "string") {
      return produtos
        .split(/[\n;]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }

    return [JSON.stringify(produtos)]
  }

  function formatarTelefone(tel: string | null) {
    if (!tel) return ""
    return tel
  }

  function formatarTempo(created_at: string | null) {
    if (!created_at) return ""
    const criado = new Date(created_at)
    const diffMs = Date.now() - criado.getTime()
    const minutos = Math.floor(diffMs / 60000)
    if (minutos < 1) return "agora"
    if (minutos === 1) return "há 1 min"
    return `há ${minutos} min`
  }

  async function handleStatus(pedido: CozinhaPedido, acao: StatusAcao) {
    if (!pedido.numero_pedido || !pedido.cliente_telefone || !pedido.cliente_nome) {
      console.error("Pedido sem dados suficientes para enviar status:", pedido)
      window.alert("Pedido sem dados de cliente ou número. Não foi possível atualizar o status.")
      return
    }

    try {
      setUpdatingId(pedido.id)

      // 🔹 WEBHOOK EXISTENTE (mantido intacto)
      await atualizarStatusPedidoWebHook({
        numero_pedido: pedido.numero_pedido,
        cliente_nome: pedido.cliente_nome,
        cliente_telefone: pedido.cliente_telefone,
        status: acao,
      })

      // 🔹 NOVO WEBHOOK — DISPARA SOMENTE EM "em_preparo"
      if (acao === "em_preparo") {
        fetch("https://n8n.SEUDOMINIO/webhook/despacho-entrega", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numero_pedido: pedido.numero_pedido,
            cliente_nome: pedido.cliente_nome,
            cliente_telefone: pedido.cliente_telefone,
          }),
        }).catch(() => {
          // silêncio absoluto: não quebra o fluxo atual
        })
      }
    } catch (err) {
      console.error("Erro ao enviar status do pedido para o webhook:", err)
      window.alert("Erro ao atualizar status do pedido. Tente novamente.")
    } finally {
      setUpdatingId(null)
    }
  }

  function Coluna({
    titulo,
    descricao,
    pedidos,
    icon,
    tipo,
  }: {
    titulo: string
    descricao: string
    pedidos: CozinhaPedido[]
    icon: React.ReactNode
    tipo: "pendente" | "em_preparo" | "saiu_para_entrega"
  }) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
              {icon}
              {titulo}
            </h2>
            <p className="text-xs text-muted-foreground">{descricao}</p>
          </div>
          <span className="text-xs text-muted-foreground">{pedidos.length} pedidos</span>
        </div>

        {pedidos.length === 0 && (
          <div className="text-xs text-muted-foreground border border-dashed rounded-lg p-4 text-center">
            Nenhum pedido aqui
          </div>
        )}

        <div className="flex flex-col gap-3">
          {pedidos.map((p) => {
            const produtos = formatarProdutos(p.produtos)
            const isUpdating = updatingId === p.id

            return (
              <Card key={p.id} className="p-3 bg-card/70 shadow-sm border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-muted-foreground">
                      #{p.numero_pedido || p.id.slice(0, 6)} • {formatarTempo(p.created_at)}
                    </div>
                    <div className="font-semibold text-sm">
                      {p.cliente_nome || "Cliente não identificado"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatarTelefone(p.cliente_telefone)}
                    </div>

                    <div className="mt-2 space-y-1">
                      {produtos.map((linha, idx) => (
                        <div
                          key={idx}
                          className="text-sm font-semibold text-red-500"
                        >
                          {linha}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs font-semibold">
                      {p.valor_total != null ? `R$ ${p.valor_total.toFixed(2)}` : ""}
                    </div>

                    {tipo === "pendente" && (
                      <Button
                        size="sm"
                        className="text-xs"
                        disabled={isUpdating}
                        onClick={() => handleStatus(p, "em_preparo")}
                      >
                        {isUpdating ? "Atualizando..." : "Em Preparo"}
                      </Button>
                    )}

                    {tipo === "em_preparo" && (
                      <Button
                        size="sm"
                        className="text-xs"
                        disabled={isUpdating}
                        onClick={() => handleStatus(p, "saiu_para_entrega")}
                      >
                        {isUpdating ? "Atualizando..." : "Saiu para Entrega"}
                      </Button>
                    )}

                    {tipo === "saiu_para_entrega" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        disabled={isUpdating}
                        onClick={() => {
                          const senha = window.prompt("Digite a senha para excluir o pedido:")
                          if (senha !== "2504") {
                            window.alert("Senha incorreta.")
                            return
                          }
                          handleStatus(p, "finalizado")
                        }}
                      >
                        {isUpdating ? "Atualizando..." : "Excluir"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Cozinha – Pedidos de Delivery
              </h1>
              <p className="text-xs text-muted-foreground">
                Lendo diretamente da tabela <code>pedidos</code> (WhatsApp / Delivery)
              </p>
            </div>
          </div>
          {isLoading && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 animate-spin" />
              Atualizando...
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Coluna
            titulo="Novos"
            descricao="Pedidos recém-chegados"
            pedidos={agrupado.pendentes}
            icon={<Clock className="h-4 w-4" />}
            tipo="pendente"
          />
          <Coluna
            titulo="Em preparo"
            descricao="Pedidos em andamento"
            pedidos={agrupado.emPreparo}
            icon={<UtensilsCrossed className="h-4 w-4" />}
            tipo="em_preparo"
          />
          <Coluna
            titulo="Saindo para entrega"
            descricao="Pedidos já prontos / em rota"
            pedidos={agrupado.saindo}
            icon={<Truck className="h-4 w-4" />}
            tipo="saiu_para_entrega"
          />
        </div>
      </main>
    </div>
  )
}
