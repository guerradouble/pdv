"use server";

async function n8nFetch(envKey: string, payload: any) {
  const url = process.env[envKey];
  if (!url) throw new Error(`Variável de ambiente ${envKey} não configurada.`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(`Erro no webhook ${envKey}:`, await response.text());
    throw new Error(`Falha ao enviar requisição para ${envKey}`);
  }

  return await response.json();
}

// Enviar item para cozinha
export async function enviarItemParaCozinha(payload: {
  pedido_id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  canal: string;
  cliente_nome: string | null;
  mesa: string | null;
}) {
  return n8nFetch("N8N_WEBHOOK_COZINHA", payload);
}

// Atualizar status de item da cozinha
export async function atualizarStatusCozinha(payload: {
  id: string;
  status: "a_fazer" | "em_preparo" | "pronto";
}) {
  return n8nFetch("N8N_WEBHOOK_ATUALIZAR_STATUS", payload);
}

// Cadastrar produto
export async function cadastrarProdutoWebHook(payload: {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  ingredientes: string | null;
  disponivel: boolean;
}) {
  return n8nFetch("N8N_WEBHOOK_CADASTRAR_PRODUTO", payload);
}

// Editar produto
export async function editarProdutoWebHook(payload: {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  ingredientes: string | null;
  disponivel: boolean;
}) {
  return n8nFetch("N8N_WEBHOOK_EDITAR_PRODUTO", payload);
}

// Deletar produto
export async function deletarProdutoWebHook(payload: { id: string }) {
  return n8nFetch("N8N_WEBHOOK_DELETAR_PRODUTO", payload);
}
