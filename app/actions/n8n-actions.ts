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

/* ✅ NOVO: Alternar Disponibilidade (DISPONÍVEL / INDISPONÍVEL) */
export async function toggleDisponibilidadeWebHook(id: string, disponivel: boolean) {
  const url = process.env.N8N_WEBHOOK_TOGGLE_DISPONIVEL;

  await fetch(url!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      disponivel,
    }),
  });
}
