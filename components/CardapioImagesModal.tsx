"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Download, ImagePlus } from "lucide-react";
import {
  uploadImages,
  deleteImage,
  listImages,
} from "@/lib/supabase/cardapio-images";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CardapioImagesModal({ onClose }: { onClose: () => void }) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const imgs = await listImages();
      setImages(imgs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploading(true);

    try {
      await uploadImages(Array.from(e.target.files));
      await load();
    } catch (err) {
      alert("Falha no upload");
      console.error(err);
    }

    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(path: string) {
    if (!confirm("Excluir esta imagem?")) return;
    await deleteImage(path);
    await load();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl p-4 bg-white relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Imagens do Cardápio</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Upload */}
        <div className="flex gap-2 mb-4">
          <Button variant="outline">
            <label className="cursor-pointer flex items-center gap-2">
              <ImagePlus className="w-4 h-4" />
              {uploading ? "Enviando..." : "Adicionar imagens"}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </Button>
        </div>

        {/* Lista */}
        {loading ? (
          <p>Carregando...</p>
        ) : images.length === 0 ? (
          <p>Nenhuma imagem encontrada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img) => (
              <Card key={img.name} className="p-2 relative">
                <img
                  src={img.url}
                  alt={img.name}
                  className="rounded-md w-full h-32 object-cover"
                />

                <div className="flex justify-between mt-2">

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(img.url, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(img.path)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
