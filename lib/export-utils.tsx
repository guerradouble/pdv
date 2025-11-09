import type { Product } from "@/types/product"

export function exportToCSV(products: Product[]) {
  const headers = ["Nome", "Tipo", "Preço", "Ingredientes", "Data de Criação"]
  const rows = products.map((p) => [
    p.nome,
    p.tipo,
    `R$ ${Number(p.preco).toFixed(2)}`,
    p.ingredientes || "",
    new Date(p.created_at).toLocaleDateString("pt-BR"),
  ])

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `cardapio_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToPDF(products: Product[]) {
  // Create a simple HTML structure for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Cardápio</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #ea580c; text-align: center; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
        .product { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .product-name { font-size: 18px; font-weight: bold; color: #333; }
        .product-price { font-size: 20px; font-weight: bold; color: #ea580c; margin-top: 10px; }
        .product-ingredients { color: #666; margin-top: 5px; }
      </style>
    </head>
    <body>
      <h1>Cardápio do Restaurante</h1>
      <p style="text-align: center; color: #666;">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
      
      ${["Hambúrguer", "Bebida", "Molho"]
        .map((tipo) => {
          const items = products.filter((p) => p.tipo === tipo)
          if (items.length === 0) return ""

          return `
            <div class="section">
              <h2>${tipo === "Hambúrguer" ? "Hambúrgueres" : tipo === "Bebida" ? "Bebidas" : "Molhos"}</h2>
              ${items
                .map(
                  (p) => `
                <div class="product">
                  <div class="product-name">${p.nome}</div>
                  ${p.ingredientes ? `<div class="product-ingredients">${p.ingredientes}</div>` : ""}
                  <div class="product-price">R$ ${Number(p.preco).toFixed(2)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          `
        })
        .join("")}
    </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const newWindow = window.open(url, "_blank")

  if (newWindow) {
    newWindow.onload = () => {
      setTimeout(() => {
        newWindow.print()
      }, 250)
    }
  }
}
