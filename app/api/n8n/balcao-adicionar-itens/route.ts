import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body || !body.pedido_id || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const urlCozinha = process.env.N8N_WEBHOOK_BALCAO_ADICIONAR_ITENS_COZINHA
    const urlBalcao = process.env.N8N_WEBHOOK_BALCAO_ADICIONAR_ITENS_BALCAO

    if (!urlCozinha || !urlBalcao) {
      return NextResponse.json(
        { error: "URLs N8N_WEBHOOK_BALCAO_ADICIONAR_ITENS_* não configuradas" },
        { status: 500 },
      )
    }

    // separa os itens
    const cozinhaItems = body.items.filter((i) => i.local_preparo === "cozinha")
    const balcaoItems = body.items.filter((i) => i.local_preparo === "balcao")

    const results: any[] = []

    // envia os dois em paralelo
    if (cozinhaItems.length > 0) {
      const res = await fetch(urlCozinha, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, items: cozinhaItems }),
      })
      results.push({ cozinha: await res.text() })
    }

    if (balcaoItems.length > 0) {
      const res = await fetch(urlBalcao, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, items: balcaoItems }),
      })
      results.push({ balcao: await res.text() })
    }

    return NextResponse.json({ ok: true, results })
  } catch (err: any) {
    console.error("Erro ao adicionar itens:", err)
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}
