"use server";

/* ✅ Cadastrar Produto */
export async function cadastrarProdutoWebHook(payload: any) {
  const url = process.env.N8N_WEBHOOK_CADASTRAR;
  if (!url) return console.error("❌ N8N_WEBHOOK_CADASTRAR não configurado");

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* ✅ Editar Produto */
export async function editarProdutoWebHook(payload: any) {
  const url = process.env.N8N_WEBHOOK_EDITAR;
  if (!url) return console.error("❌ N8N_WEBHOOK_EDITAR não configurado");

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* ✅ Apagar Produto */
export async function deletarProdutoWebHook(id: string) {
  const url = process.env.N8N_WEBHOOK_DELETAR_PRODUTO;
  if (!url) return console.error("❌ N8N_WEBHOOK_DELETAR_PRODUTO não configurado");

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

/* ✅ Alternar Disponibilidade */
export async function toggleDisponibilidadeWebHook(id: string, disponivel: boolean) {
  const url = process.env.N8N_WEBHOOK_TOGGLE_DISPONIVEL;
  if (!url) return console.error("❌ N8N_WEBHOOK_TOGGLE_DISPONIVEL não configurada");

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

/* ✅ Sincronizar disponibilidade com webhook de editar (RAG + PDV Delivery) */
export async function syncDisponibilidadeComWebhookEditar(id: string, disponivel: boolean) {
  const url = process.env.N8N_WEBHOOK_EDITAR;
  if (!url) return; // opcional

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      disponivel,
      origem: "toggle_disponibilidade_sync"
    }),
  });
}

