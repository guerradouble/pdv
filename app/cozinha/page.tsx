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

// ———————————————————————————————————————————————————
// TIPOS

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

// ———————————————————————————————————————————————————
// CONSTANTES DE COLUNAS

const COLUMNS: { id: Status; title: string; hint?: string }[] = [
  { id: "a_fazer", title: "Novos", hint: "Pedidos que acabaram de chegar" },
  { id: "em_preparo", title: "Em Preparo", hint: "Itens sendo feitos" },
  { id: "pronto", title: "Pronto", hint: "Liberar para entrega/balcão" },
]

// ———————————————————————————————————————————————————
// UI DE CARD (draggable simples sem handle)

function KdsCard({ item }: { item: CozinhaItem }) {
  return (
    <Card
      className={cn(
        "p-3 bg-card/70 shadow-sm border border-border",
        "hover:shadow-md transition-shadow",
      )}
    >
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

// ———————————————————————————————————————————————————
// COLUNA

function KdsColumn({
  title,
  id,
  items,
}: {
  title: string
  id: Status
  items: CozinhaItem[]
}) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{title}</h2>
      </div>

      {/* Droppable area com SortableContext (mesmo sem reorder interno, mantém consistência) */}
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          id={id}
          className={cn(
            "grid gap-3 auto-rows-min",
            "min-h-[200px] rounded-lg border border-dashed border-muted-foreground/20 p-2",
          )}
        >
          {items.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">Sem itens aqui</div>
          ) : (
            items.map((item) => (
              <div key={item.id} data-draggable-id={item.id}>
                <KdsCard item={item} />
              </div>
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// ———————————————————————————————————————————————————
// PÁGINA

export default function CozinhaPage() {
  const supabase = getSupabaseBrowserClient()
  const [items, setItems] = useState<CozinhaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // sensores DnD (pointer)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  // carregar dados
  const load = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("cozinha_itens")
      .select("*")
      .order("created_at", { ascending: true })
    if (!error && data) setItems(data as CozinhaItem[])
    setIsLoading(false)
  }

  // realtime
  useEffect(() => {
    load()
    const channel = supabase
      .channel("cozinha_realtime_kds")
      .on("postgres_changes", { event: "*", schema: "public", table: "cozinha_itens" }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // agrupamento por status
  const grouped = useMemo(() => {
    const map: Record<Status, CozinhaItem[]> = { a_fazer: [], em_preparo: [], pronto: [] }
    for (const it of items) map[it.status].push(it)
    return map
  }, [items])

  // descobrir ID do item arrastado (usamos atributo data)
  function findDraggedId(target: HTMLElement | null): string | null {
    if (!target) return null
    let el: HTMLElement | null = target
    while (el && !el.dataset?.draggableId) el = el.parentElement
    return el?.dataset?.draggableId || null
  }

  // onDragEnd: quando solta em outra coluna, atualiza status via n8n
  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    // a coluna é o container com id igual ao status
    const newStatus = over.id as Status
    if (!["a_fazer", "em_preparo", "pronto"].includes(newStatus)) return

    // recuperar o id do item arrastado
    const draggableId = findDraggedId((active.node as any) ?? null)
    if (!draggableId) return

    // se já está na mesma coluna, ignora
    const item = items.find((i) => i.id === draggableId)
    if (!item || item.status === newStatus) return

    // otimista: aplica na UI
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)))

    // persistência via n8n
    try {
      await atualizarStatusCozinha({ id: item.id, status: newStatus })
      // ok — realtime vai confirmar
    } catch (e) {
      // rollback se falhar
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)))
      alert("Falha ao atualizar status. Verifique conexão com o n8n.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Cozinha</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={isLoading}>
              Recarregar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando itens…</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            modifiers={[restrictToWindowEdges]}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COLUMNS.map((col) => (
                <div key={col.id} className="min-h-[70vh]">
                  <KdsColumn
                    id={col.id}
                    title={col.title}
                    items={grouped[col.id]}
                  />
                </div>
              ))}
            </div>
          </DndContext>
        )}
      </main>
    </div>
  )
}
