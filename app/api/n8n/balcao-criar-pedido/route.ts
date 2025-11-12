// app/api/n8n/balcao-criar-pedido/route.ts
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const urlCozinha = process.env.N8N_WEBHOOK_BALCAO_CRIAR_PEDIDO
    const urlBalcao = process.env.N8N_WEBHOOK_BALCAO_CRIAR_PEDIDO_BALCAO

    if (!urlCozinha) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_BALCAO_CRIAR_PEDIDO não configurado" },
        { status: 500 },
      )
    }
    if (!urlBalcao) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_BALCAO_CRIAR_PEDIDO_BALCAO não configurado" },
        { status: 500 },
      )
    }

    const body = await req.json()

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Payload inválido: items vazio." }, { status: 400 })
    }

    // separa os produtos conforme o local_preparo
    const itemsCozinha = body.items.filter((i: any) => i.local_preparo === "cozinha")
    const itemsBalcao = body.items.filter((i: any) => i.local_preparo === "balcao")

    const promises: Promise<Response>[] = []

    // envia os produtos da cozinha para o webhook já existente
    if (itemsCozinha.length > 0) {
      const payloadCozinha = { ...body, items: itemsCozinha }
      promises.push(
        fetch(urlCozinha, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadCozinha),
        }),
      )
    }

    // envia os produtos do balcão para o novo webhook
    if (itemsBalcao.length > 0) {
      const payloadBalcao = { ...body, items: itemsBalcao }
      promises.push(
        fetch(urlBalcao, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadBalcao),
        }),
      )
    }

    // aguarda todas as requisições (caso tenha ambos tipos)
    await Promise.all(promises)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Erro no webhook balcão:", err)
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 })
  }
}
