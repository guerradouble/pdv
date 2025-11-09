// lib/n8n.ts
export async function n8nFetch(urlEnvVar: string, payload: any) {
  const url = process.env[urlEnvVar];
  if (!url) throw new Error(`${urlEnvVar} não configurada`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha no webhook ${urlEnvVar}: ${res.status} ${text}`);
  }
  try { return await res.json(); } catch { return {}; }
}

/** Cardápio */
export async function cadastrarProdutoWebHook(data: {
  nome: string; tipo: string; preco: number;
  ingredientes?: string | null; local_preparo: "balcao" | "cozinha"; disponivel: boolean;
}) {
  return n8nFetch("N8N_WEBHOOK_CADASTRAR", data);
}

export async function editarProdutoWebHook(data: {
  id: string;
  nome?: string; tipo?: string; preco?: number;
  ingredientes?: string | null; local_preparo?: "balcao" | "cozinha"; disponivel?: boolean;
}) {
  return n8nFetch("N8N_WEBHOOK_EDITAR", data);
}

export async function deletarProdutoWebHook(id: string) {
  return n8nFetch("N8N_WEBHOOK_DELETAR", { id });
}

/** Balcão → Cozinha */
export async function enviarItemParaCozinha(payload: {
  pedido_id: string;
  produto_id: string;
  produto_nome: string;
  quantidade?: number;
  mesa?: string | null;
  cliente_nome?: string | null;
}) {
  return n8nFetch("N8N_WEBHOOK_COZINHA", payload);
// Atualizar status de item da cozinha
export async function atualizarStatusCozinha(payload: {
  id: string;
  status: "a_fazer" | "em_preparo" | "pronto";
}) {
  return n8nFetch("N8N_WEBHOOK_ATUALIZA_STATUS", payload);
}


}
