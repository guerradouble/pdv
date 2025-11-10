"use server";

/* ✅ Enviar item para a Cozinha */
export async function enviarItemParaCozinha(payload: any) {
  const url = process.env.N8N_WEBHOOK_COZINHA;
  if (!url) return console.error("❌ N8N_WEBHOOK_COZINHA não configurado");

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

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

/* ✅ Atualizar Status na Cozinha */
export async function atualizarStatusCozinha(payload: any) {
  const url = process.env.N8N_WEBHOOK_ATUALIZA_STATUS;
  if (!url) return console.error("❌ N8N_WEBHOOK_ATUALIZA_STATUS não configurado");

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* ✅ Alternar Disponibilidade (Disponível / Indisponível) */
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

/* ✅ Enviar também para o webhook de edição, para manter sincronizado (RAG e PDV/Delivery) */
export async function syncDisponibilidadeComWebhookEditar(id: string, disponivel: boolean) {
  const url = process.env.N8N_WEBHOOK_EDITAR;
  if (!url) return; // aqui não precisa erro, é opcional

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
