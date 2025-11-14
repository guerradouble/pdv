// app/cozinha/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock, UtensilsCrossed, Truck } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type StatusPedido = "pendente" | "em_preparo" | "saiu_para_entrega" | "finalizado"

type CozinhaPedido = {
  id: string
  numero_pedido: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  endereco: string | null
  produtos: any
  valor_total: number | null
  status: StatusPedido
  created_at: string | null
}

export default function CozinhaPage() {
  const supabase = getSupabaseBrowserClient()
  const [pedidos, setPedidos] = useState<CozinhaPedido[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, numero_pedido, cliente_nome, cliente_telefone, endereco, produtos, valor_total, status, created_at")
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
          // sempre que um pedido mudar, recarrega a lista
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

    // Se já for array de strings ou objetos
    if (Array.isArray(produtos)) {
      return produtos.map((p: any) => {
        if (typeof p === "string") return p
        if (p.nome && p.quantidade) return `${p.quantidade}x ${p.nome}`
        if (p.nome) return p.nome
        return JSON.stringify(p)
      })
    }

    // Se for string única (caso antigo)
    if (typeof produtos === "string") {
      return produtos
        .split(/[\n;]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }

    // Qualquer outra coisa: JSON.stringify
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

  function Coluna({
    titulo,
    descricao,
    pedidos,
    icon,
  }: {
    titulo: string
    descricao: string
    pedidos: CozinhaPedido[]
    icon: React.ReactNode
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
                    {p.endereco && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {p.endereco}
                      </div>
                    )}
                    <div className="mt-2 space-y-1">
                      {produtos.map((linha, idx) => (
                        <div key={idx} className="text-xs">
                          {linha}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs font-semibold">
                    {p.valor_total != null ? `R$ ${p.valor_total.toFixed(2)}` : ""}
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
              <Clock className="h-3 w-3" />
              Atualizando...
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Coluna
            titulo="Novos"
            descricao="Pedidos pendentes"
            pedidos={agrupado.pendentes}
            icon={<Clock className="h-4 w-4" />}
          />
          <Coluna
            titulo="Em Preparo"
            descricao="Pedidos em andamento"
            pedidos={agrupado.emPreparo}
            icon={<UtensilsCrossed className="h-4 w-4" />}
          />
          <Coluna
            titulo="Saindo para entrega"
            descricao="Pedidos já prontos / em rota"
            pedidos={agrupado.saindo}
            icon={<Truck className="h-4 w-4" />}
          />
        </div>
      </main>
    </div>
  )
}
