// hooks/use-product-types.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type TipoRow = { id: number; nome: string; ordem: number | null };

export function useProductTypes() {
  const supabase = getSupabaseBrowserClient();

  const [types, setTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("tipos_produtos")
        .select("nome, ordem")
        .order("ordem", { ascending: true, nullsFirst: true })
        .order("nome", { ascending: true });
      if (error) throw error;
      const names = (data as TipoRow[] | null)?.map((r: any) => r.nome) ?? [];
      setTypes(names);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao carregar tipos");
      setTypes([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const addType = useCallback(
    async (name: string) => {
      const trimmed = (name ?? "").trim();
      if (!trimmed) throw new Error("Nome do tipo é obrigatório");
      // evita duplicado na UI
      if (types.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error("Este tipo já existe");
      }
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("tipos_produtos")
          .insert({ nome: trimmed });
        if (error) throw error;
        await fetchTypes();
      } catch (err: any) {
        throw new Error(err?.message ?? "Erro ao adicionar tipo");
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, fetchTypes, types]
  );

  const deleteType = useCallback(
    async (name: string) => {
      const trimmed = (name ?? "").trim();
      if (!trimmed) throw new Error("Nome do tipo é obrigatório");
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("tipos_produtos")
          .delete()
          .eq("nome", trimmed);
        if (error) throw error;
        await fetchTypes();
      } catch (err: any) {
        throw new Error(err?.message ?? "Erro ao excluir tipo");
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, fetchTypes]
  );

  useEffect(() => {
    // carga inicial
    fetchTypes();
    // realtime: sempre que mudar, recarrega
    const channel = supabase
      .channel("tipos_produtos_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tipos_produtos" },
        () => {
          fetchTypes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchTypes]);

  return { types, isLoading, error, addType, deleteType, refresh: fetchTypes };
}
