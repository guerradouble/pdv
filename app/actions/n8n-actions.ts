"use server";

export async function enviarItemParaCozinha(payload: any) {
  const url = process.env.N8N_WEBHOOK_COZINHA;
  await fetch(url!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function cadastrarProdutoWebHook(payload: any) {
  const url = process.env.N8N_WEBHOOK_CADASTRAR;
  await fetch(url!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function editarProdutoWebHook(payload: any) {
  const url = process.env.N8N_WEBHOOK_EDITAR;
  await fetch(url!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deletarProdutoWebHook(id: string) {
  const url = process.env.N8N_WEBHOOK_DELETAR_PRODUTO;
  await fetch(url!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function atualizarStatusCozinha(payload: any) {
  const url = process.env.N8N_WEBHOOK_ATUALIZA_STATUS;
  await fetch(url!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* ✅ ALTERNA DISPONIBILIDADE (Disponível/Indisponível) */
export async function toggleDisponibilidadeWebHook(id: string, disponivel: boolean) {
  const url = process.env.N8N_WEBHOOK_TOGGLE_DISPONIVEL;

  if (!url) {
    console.error("❌ Variável N8N_WEBHOOK_TOGGLE_DISPONIVEL não configurada.");
    return;
  }

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      disponivel,
    }),
  });
}

/* ✅ SINCRONIZA COM O WEBHOOK DE EDIÇÃO (para RAG / PDV / Delivery / etc) */
export async function syncDisponibilidadeComWebhookEditar(id: string, disponivel: boolean) {
  const url = process.env.N8N_WEBHOOK_EDITAR;

  if (!url) return;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      disponivel,
      origem: "toggle_disponibilidade"
    }),
  });
}
