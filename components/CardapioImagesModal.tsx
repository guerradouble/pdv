"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { listImages, deleteImage, uploadImages } from "@/lib/supabase/storage"
import { X, Trash, Download, Copy, Upload } from "lucide-react"
import Image from "next/image"

interface Props {
  onClose: () => void
}

export function CardapioImagesModal({ onClose }: Props) {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const list = await listImages()
      setImages(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // ========================= Upload ===========================
  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      await uploadImages(Array.from(files))
      await load()
    } catch (err) {
      console.error(err)
      alert("Falha ao enviar imagens")
    } finally {
      setUploading(false)
    }
  }

  // ========================= Delete ===========================
  async function handleDelete(path: string) {
    if (!confirm("Excluir essa imagem?")) return

    try {
      await deleteImage(path)
      await load()
    } catch (err) {
      alert("Erro ao excluir imagem")
    }
  }

  // ========================= Copy URL ===========================
  function handleCopy(url: string) {
    navigator.clipboard.writeText(url)
    alert("URL copiada!")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-[90%] max-w-4xl max-h-[90%] overflow-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Imagens do Cardápio</h2>

          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Button */}
        <div className="mb-4">
          <label className="flex gap-2 items-center cursor-pointer bg-blue-600 text-white px-3 py-2 rounded">
            <Upload className="w-4 h-4" />
            {uploading ? "Enviando..." : "Enviar imagens"}
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleUpload}
            />
          </label>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-muted-foreground">Carregando imagens...</p>
        ) : images.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma imagem enviada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div key={img.name} className="border rounded p-2 flex flex-col gap-2">
                <Image
                  src={img.url}
                  alt={img.name}
                  width={200}
                  height={200}
                  className="w-full h-32 object-cover rounded"
                />

                <p classname="text-xs break-all">{img.name}</p>

                <div className="flex justify-between mt-auto">
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(img.path)}
                    className="text-red-600"
                  >
                    <Trash className="w-4 h-4" />
                  </button>

                  {/* Download */}
                  <a
                    href={img.url}
                    download
                    className="text-blue-600"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {/* Copy URL */}
                  <button
                    onClick={() => handleCopy(img.url)}
                    className="text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
