import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const url = process.env.N8N_WEBHOOK_BALCAO_CRIAR_PEDIDO
    if (!url) {
      return NextResponse.json({ ok: false, error: "N8N_WEBHOOK_BALCAO_CRIAR_PEDIDO não configurado" }, { status: 500 })
    }

    const body = await req.json()

    // validação mínima e normalização (defensivo)
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ ok: false, error: "Payload inválido: items vazio" }, { status: 400 })
    }

    const payload = {
      nome_cliente: (body.nome_cliente || "Balcão").toString().trim(),
      telefone: body.telefone ? String(body.telefone) : null,
      mesa: body.mesa ? String(body.mesa) : null,
      canal: "balcao" as const,
      items: body.items.map((it: any) => ({
        produto_id: String(it.produto_id),
        produto_nome: String(it.produto_nome),
        produto_preco: Number(it.produto_preco),
        quantidade: Number(it.quantidade || 1),
      })),
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const text = await resp.text()
    let data: any = {}
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    if (!resp.ok) {
      return NextResponse.json({ ok: false, status: resp.status, data }, { status: 500 })
    }

    return NextResponse.json({ ok: true, ...data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Erro inesperado" }, { status: 500 })
  }
}
