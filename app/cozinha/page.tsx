"use client"

import { useEffect, useMemo, useState } from "react"
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { atualizarStatusCozinha } from "@/lib/n8n"
import { cn } from "@/lib/utils"

type Status = "a_fazer" | "em_preparo" | "pronto"

type CozinhaItem = {
  id: string
  pedido_id: string
  produto_id: string
  produto_nome: string
  quantidade: number
  mesa: string | null
  cliente_nome: string | null
  status: Status
  created_at?: string
}

const COLUMNS = [
  { id: "a_fazer", title: "Novos" },
  { id: "em_preparo", title: "Em Preparo" },
  { id: "pronto", title: "Pronto" },
]

function KdsCard({ item }: { item: CozinhaItem }) {
  return (
    <Card className={cn("p-3 bg-card/70 shadow-sm border border-border", "hover:shadow-md transition-shadow")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold leading-tight">
            {item.produto_nome}{" "}
            <span className="text-xs text-muted-foreground">x{item.quantidade}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {item.cliente_nome ? `Cliente: ${item.cliente_nome}` : "Cliente: Balcão"}
            {item.mesa ? ` • Mesa ${item.mesa}` : ""}
          </div>
        </div>
        <div className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
          #{(item.pedido_id || "").slice(0, 6)}
        </div>
      </div>
    </Card>
  )
}

function KdsColumn({ title, id, items }: { title: string; id: Status; items: CozinhaItem[] }) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="sticky top-0 z-10 bg-background/80 py-2 backdrop-blur">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">{title}</h2>
      </div>

      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-3 auto-rows-min min-h-[200px] rounded-lg border border-dashed border-muted-foreground/20 p-2">
          {items.length === 0
            ? <div className="text-center text-xs text-muted-foreground py-8">Sem itens aqui</div>
            : items.map((item) => <KdsCard key={item.id} item={item} />)}
        </div>
      </SortableContext>
    </div>
  )
}

export default function CozinhaPage() {
  const supabase = getSupabaseBrowserClient()
  const [items, setItems] = useState<CozinhaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const load = async () => {
    setIsLoading(true)
    const { data } = await supabase.from("cozinha_itens").select("*").order("created_at", { ascending: true })
    if (data) setItems(data as CozinhaItem[])
    setIsLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel("cozinha_realtime_kds")
      .on("postgres_changes", { event: "*", schema: "public", table: "cozinha_itens" }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const grouped = useMemo(() => {
    const g: Record<Status, CozinhaItem[]> = { a_fazer: [], em_preparo: [], pronto: [] }
    for (const it of items) g[it.status].push(it)
    return g
  }, [items])

  const onDragEnd = async (event: DragEndEvent) => {}

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">

          {/* ✅ Botão de Voltar Adicionado */}
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            ← Voltar
          </Button>

          <h1 className="text-xl font-semibold">Cozinha</h1>

          <Button variant="outline" onClick={load} disabled={isLoading}>
            Recarregar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToWindowEdges]}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <div key={col.id} className="min-h-[70vh]">
                <KdsColumn id={col.id} title={col.title} items={grouped[col.id]} />
              </div>
            ))}
          </div>
        </DndContext>
      </main>
    </div>
  )
}
