// app/api/n8n/balcao-criar-pedido/route.ts
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const url = process.env.N8N_WEBHOOK_BALCAO_CRIAR
    if (!url) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_BALCAO_CRIAR não configurado" },
        { status: 500 },
      )
    }

    const body = await req.json()

    // sanity mínima — não “arruma” nada aqui; só barra payload vazio
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Payload inválido: items vazio." }, { status: 400 })
    }

    // repassa puro para o n8n (o fan-out é feito lá)
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    if (!res.ok) {
      return new NextResponse(text || "Erro do n8n", { status: res.status })
    }

    // retorna o que o n8n devolver (id do pedido, etc.)
    try {
      return NextResponse.json(JSON.parse(text))
    } catch {
      return new NextResponse(text, { status: 200 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro interno" }, { status: 500 })
  }
}
