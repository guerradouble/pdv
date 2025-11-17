"use server";

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

  try { 
    return await res.json(); 
  } catch { 
    return {}; 
  }
}

/* CADASTRAR PRODUTO */
export async function cadastrarProdutoWebHook(data: {
  nome: string; 
  tipo: string; 
  preco: number;
  ingredientes?: string | null;
  disponivel: boolean;
}) {
  return n8nFetch("N8N_WEBHOOK_CADASTRAR", data);
}

/* EDITAR PRODUTO */
export async function editarProdutoWebHook(data: {
  id: string;
  nome?: string; 
  tipo?: string; 
  preco?: number;
  ingredientes?: string | null; 
  disponivel?: boolean;
}) {
  return n8nFetch("N8N_WEBHOOK_EDITAR", data);
}

export async function deletarProdutoWebHook(id: string) {
  return n8nFetch("N8N_WEBHOOK_DELETAR", { id });
}

/* STATUS DO PEDIDO – COZINHA */
export async function atualizarStatusPedidoWebHook(data: {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  status: "em_preparo" | "saiu_para_entrega" | "finalizado";
}) {
  return n8nFetch("N8N_WEBHOOK_STATUS_PEDIDO", data);
}

