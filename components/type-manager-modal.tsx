"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { X, Plus, Trash2 } from "lucide-react"

interface TypeManagerModalProps {
  types: string[]
  onClose: () => void
  onAddType: (name: string) => Promise<void>
  onDeleteType: (name: string) => Promise<void>
  isLoading?: boolean
}

export function TypeManagerModal({
  types,
  onClose,
  onAddType,
  onDeleteType,
  isLoading = false,
}: TypeManagerModalProps) {
  const [newTypeName, setNewTypeName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [deletingTypes, setDeletingTypes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTypeName.trim()) {
      setError("Digite um nome para o tipo")
      return
    }

    setIsAdding(true)
    setError(null)
    try {
      await onAddType(newTypeName)
      setNewTypeName("")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar tipo"
      setError(errorMessage)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteType = async (typeName: string) => {
    if (
      !confirm(`Tem certeza que deseja excluir o tipo "${typeName}"? Todos os produtos associados serão deletados.`)
    ) {
      return
    }

    setDeletingTypes([...deletingTypes, typeName])
    setError(null)
    try {
      await onDeleteType(typeName)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao excluir tipo"
      setError(errorMessage)
    } finally {
      setDeletingTypes(deletingTypes.filter((t) => t !== typeName))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-card">
          <h2 className="text-xl font-semibold text-foreground">Editar Tipos de Produtos</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Existing types list */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">Tipos Existentes</h3>
            <div className="space-y-2">
              {types.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum tipo cadastrado</p>
              ) : (
                types.map((type) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-foreground font-medium">{type}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteType(type)}
                      disabled={deletingTypes.includes(type) || isLoading}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add new type form */}
          <div className="border-t pt-6 space-y-3">
            <h3 className="font-medium text-foreground">Adicionar Novo Tipo</h3>
            <form onSubmit={handleAddType} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-type-name">Nome do Tipo *</Label>
                <Input
                  id="new-type-name"
                  value={newTypeName}
                  onChange={(e) => {
                    setNewTypeName(e.target.value)
                    setError(null)
                  }}
                  placeholder="Ex: Sobremesa, Refrigerante, etc"
                  disabled={isAdding || isLoading}
                />
              </div>
              <Button type="submit" disabled={isAdding || isLoading} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Tipo
              </Button>
            </form>
          </div>

          {/* Close button */}
          <Button type="button" variant="outline" onClick={onClose} className="w-full bg-transparent">
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  )
}
