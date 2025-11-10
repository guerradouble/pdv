"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Search, Plus, X } from "lucide-react"
import type { Product } from "@/types/product"
import type { OrderFormData, OrderFormItem } from "@/types/order"

interface OrderFormProps {
  products: Product[]
  onSubmit: (order: OrderFormData) => void
}

export function OrderForm({ products, onSubmit }: OrderFormProps) {
  const [clientData, setClientData] = useState({
    nome_cliente: "",
    telefone: "",
    mesa: "",
  })

  // ✅ carrega local_preparo junto
  const [items, setItems] = useState<(OrderFormItem & {
    tempId: string
    searchTerm: string
    local_preparo?: "balcao" | "cozinha"
  })[]>([
    { tempId: "1", produto_id: "", produto_nome: "", produto_preco: 0, quantidade: 1, searchTerm: "", local_preparo: "balcao" },
  ])

  const [showProductList, setShowProductList] = useState<{ [key: string]: boolean }>({})
  const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: Product | null }>({})

  // ✅ garante array sempre
  const filteredProducts = (searchTerm: string) => {
    const list = Array.isArray(products) ? products : []
    if (!searchTerm) return list

    const term = searchTerm.toLowerCase()
    return list.filter(
      (product) =>
        product.nome.toLowerCase().includes(term) ||
        product.tipo.toLowerCase().includes(term) ||
        (product.ingredientes && product.ingredientes.toLowerCase().includes(term)),
    )
  }

  const handleProductSelect = (tempId: string, product: Product) => {
    if (product.disponivel === false) return // 🚫 impede seleção se em falta

    setSelectedProducts({ ...selectedProducts, [tempId]: product })
    setItems(
      items.map((item) =>
        item.tempId === tempId
          ? {
              ...item,
              produto_id: product.id,
              produto_nome: product.nome,
              produto_preco: Number(product.preco), // ✅ numérico
              local_preparo: (product as any).local_preparo || "balcao", // ✅ leva pro pedido
              searchTerm: product.nome,
            }
          : item,
      ),
    )
    setShowProductList({ ...showProductList, [tempId]: false })
  }

  const handleAddItem = () => {
    const newTempId = String(Math.max(...items.map((i) => Number(i.tempId)), 0) + 1)
    setItems([
      ...items,
      { tempId: newTempId, produto_id: "", produto_nome: "", produto_preco: 0, quantidade: 1, searchTerm: "", local_preparo: "balcao" },
    ])
  }

  const handleRemoveItem = (tempId: string) => {
    if (items.length === 1) {
      alert("Você precisa de pelo menos um item no pedido")
      return
    }
    setItems(items.filter((item) => item.tempId !== tempId))
    const newShowList = { ...showProductList }
    delete newShowList[tempId]
    setShowProductList(newShowList)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientData.nome_cliente.trim()) {
      alert("Por favor, insira o nome do cliente")
      return
    }

    if (items.some((item) => !item.produto_id)) {
      alert("Por favor, selecione um produto para todos os itens")
      return
    }

    if (items.some((item) => item.quantidade < 1)) {
      alert("A quantidade deve ser maior que 0")
      return
    }

    // ✅ preserva local_preparo no payload (cast pra não travar TS se o tipo original não tiver essa chave)
    const orderData: OrderFormData = {
      nome_cliente: clientData.nome_cliente,
      telefone: clientData.telefone || undefined,
      mesa: clientData.mesa || undefined,
      items: items.map(({ tempId, searchTerm, local_preparo, ...rest }) =>
        ({ ...rest, ...(local_preparo ? { local_preparo } : {}) })
      ) as any,
      tipo: "balcao",
    }

    onSubmit(orderData)

    setClientData({ nome_cliente: "", telefone: "", mesa: "" })
    setItems([{ tempId: "1", produto_id: "", produto_nome: "", produto_preco: 0, quantidade: 1, searchTerm: "", local_preparo: "balcao" }])
    setShowProductList({})
    setSelectedProducts({})
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + Number(item.produto_preco) * Number(item.quantidade), 0)
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Novo Pedido</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome_cliente">Nome do Cliente *</Label>
            <Input
              id="nome_cliente"
              value={clientData.nome_cliente}
              onChange={(e) => setClientData({ ...clientData, nome_cliente: e.target.value })}
              placeholder="Digite o nome"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              type="tel"
              value={clientData.telefone}
              onChange={(e) => setClientData({ ...clientData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mesa">Número da Mesa</Label>
            <Input
              id="mesa"
              value={clientData.mesa}
              onChange={(e) => setClientData({ ...clientData, mesa: e.target.value })}
              placeholder="Ex: Mesa 5"
            />
          </div>
        </div>

        {/* Items */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Itens do Pedido</h3>
            <Button type="button" onClick={handleAddItem} variant="outline" size="sm" className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.tempId} className="p-4 border rounded-lg space-y-3 bg-card relative">

                {/* Search */}
                <div className="space-y-2 relative">
                  <Label>Produto *</Label>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={item.searchTerm}
                      onChange={(e) => {
                        setItems(items.map((i) => i.tempId === item.tempId ? { ...i, searchTerm: e.target.value } : i))
                        setShowProductList({ ...showProductList, [item.tempId]: true })
                      }}
                      onFocus={() => setShowProductList({ ...showProductList, [item.tempId]: true })}
                      placeholder="Digite para buscar produto..."
                      className="pl-10"
                      required
                    />
                  </div>

                  {showProductList[item.tempId] && filteredProducts(item.searchTerm).length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts(item.searchTerm).map((product) => {
                        const isUnavailable = product.disponivel === false
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => !isUnavailable && handleProductSelect(item.tempId, product)}
                            disabled={isUnavailable}
                            className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                              isUnavailable ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-foreground flex items-center gap-2">
                                  {product.nome}
                                  {isUnavailable && (
                                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                                      Em Falta
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {product.tipo} {product.ingredientes ? `• ${product.ingredientes}` : ""}
                                </div>
                              </div>
                              <span className="font-semibold text-foreground">
                                R$ {Number(product.preco).toFixed(2)}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) =>
                      setItems(items.map((i) =>
                        i.tempId === item.tempId
                          ? { ...i, quantidade: Math.max(1, Number.parseInt(e.target.value) || 1) }
                          : i
                      ))
                    }
                    required
                  />
                </div>

                {item.produto_preco > 0 && (
                  <div className="text-sm text-muted-foreground flex items-center justify-between pt-2 border-t">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-foreground">
                      R$ {(Number(item.produto_preco) * Number(item.quantidade)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-semibold text-foreground">Total do Pedido:</span>
            <span className="text-2xl font-bold text-foreground">R$ {calculateTotal().toFixed(2)}</span>
          </div>

          <Button type="submit" className="w-full">
            Registrar Pedido
          </Button>
        </div>
      </form>
    </Card>
  )
}
