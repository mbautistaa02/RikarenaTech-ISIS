import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { showToast } from "@/lib/toast";
import {
  createMarketplacePost,
  getCategories,
} from "@/services/postsService.ts";
import type { Category } from "@/types/category.ts";

type FormState = {
  title: string;
  content: string;
  price: number | string;
  images: string;
  quantity: number | string;
  unit_of_measure: string;
};

export const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [form, setForm] = useState<FormState>({
    title: "",
    content: "",
    price: "",
    images: "",
    quantity: 0,
    unit_of_measure: "unidad",
  });
  useEffect(() => {
    const controller = new AbortController();
    const loadCategories = async () => {
      try {
        const data = await getCategories(controller.signal);
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching categories", err);
          setCategories([]);
        }
      }
    };
    loadCategories();
    return () => controller.abort();
  }, []);
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // Si el usuario elige "Todas" o vacío, ponemos null o vacío según lo que espere tu backend
    setSelectedCategory(value === "" ? "" : Number(value));
  };
  const handleSave = async () => {
    // Crear FormData REAL con los archivos
    const formData = new FormData();

    // Añadir los campos de texto
    formData.append("title", form.title);
    formData.append("content", form.content);
    formData.append("price", String(form.price));
    formData.append("quantity", String(form.quantity));
    formData.append("unit_of_measure", form.unit_of_measure);
    formData.append("category", String(selectedCategory));
    // Añadir todas las imágenes (puedes enviar una o varias)
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      await createMarketplacePost(formData);
      showToast("success", "Post creado correctamente.");
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/my_products");
      }, 2000);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showToast("error", "Error al crear el post: " + message);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 px-8 flex flex-col gap-10">
      <div className="w-full min-h-screen bg-gray-50 py-10 flex flex-col gap-10">
        {/* Título */}
        <h1 className="font-[Outfit] text-[30px] font-bold text-neutral-900">
          Crear nuevo post de venta
        </h1>

        {/* Contenedor principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ----------- COLUMNA IZQUIERDA ----------- */}
          <div className="bg-white shadow-sm rounded-xl p-6">
            <h2 className="font-[Outfit] text-[20px] font-semibold text-neutral-900">
              Imagen principal
            </h2>

            <p className="font-[Inter] text-[14px] text-neutral-600 mt-2">
              Sube la imagen para tu publicación.
            </p>

            <div
              className="mt-2 border-2 border-neutral-300 border-dashed
            bg-neutral-200/20 rounded-xl w-full h-[580px] flex flex-col
            items-center justify-center relative"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (!e.target.files) return;

                  const imgs = Array.from(e.target.files);
                  const firstImage = imgs[0];

                  setFiles(imgs);
                  const imageUrl = URL.createObjectURL(firstImage);
                  setSelectedImage(imageUrl);
                  setShowImage(true);

                  setForm((prev) => ({ ...prev, images: imageUrl }));
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {showImage && selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-xl pointer-events-none"
                />
              ) : (
                <>
                  <svg
                    className="w-12 h-12 text-neutral-600 pointer-events-none"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 16l4-5h-3V4h-2v7H8z" />
                  </svg>
                  <p className="mt-4 font-[Inter] text-[16px] text-neutral-600 text-center pointer-events-none">
                    Arrastra o haz clic para subir una imagen
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ----------- COLUMNA DERECHA ----------- */}
          <div className="bg-white shadow-sm border border-green-700 rounded-xl p-6">
            <h2 className="font-[Outfit] text-[20px] font-semibold text-neutral-900">
              Información del post
            </h2>

            <p className="font-[Inter] text-[14px] text-neutral-600 mt-2">
              Completa los detalles de tu publicación.
            </p>

            {/* ----- Campo: Título ----- */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Título
              </label>
              <input
                type="text"
                className="w-full h-[49px] px-3 font-[Inter] text-sm bg-neutral-200/10 border border-neutral-300 rounded-md hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-300/30"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            {/* ----- Campo: Descripción ----- */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Descripción
              </label>
              <textarea
                className="w-full h-[120px] px-3 py-2 font-[Inter] text-sm text-neutral-900 bg-neutral-200/10 border border-neutral-300 rounded-md hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-300/30"
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
              />
            </div>

            {/* ----- Campo: Precio ----- */}
            <div className="mt-6 flex flex-col gap-1 relative">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Precio
              </label>
              <input
                type="number"
                className="w-full h-[49px] px-9 bg-neutral-200/10 border border-neutral-300 rounded-md font-[Inter] text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300/30"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
              />
              <span className="absolute left-3 top-[46px] font-bold text-neutral-600">
                $
              </span>
            </div>

            {/* ----- Campo: Cantidad ----- */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Cantidad
              </label>
              <input
                type="number"
                className="w-full h-[49px] px-3 bg-neutral-200/10 border border-neutral-300 rounded-md font-[Inter] text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300/30"
                value={form.quantity}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quantity: e.target.value }))
                }
              />
            </div>

            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Unidad
              </label>
              <input
                type="text"
                className="w-full h-[49px] px-3 font-[Inter] text-sm bg-neutral-200/10 border border-neutral-300 rounded-md hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-300/30"
                value={form.unit_of_measure}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    unit_of_measure: e.target.value,
                  }))
                }
              />
            </div>

            {/* ----- Label categoría ----- */}
            <p className="mt-8 font-[Inter] text-sm font-medium text-neutral-900">
              Categoría
            </p>
            <div className="mt-3 relative">
              <select
                value={selectedCategory === "" ? "" : String(selectedCategory)}
                onChange={handleCategoryChange}
                className="appearance-none w-[200px] h-10 px-3 pr-8 border border-neutral-300 rounded-md font-[Inter] text-sm text-neutral-900 focus:outline-none"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ----- Botón crear post ----- */}
            <button
              onClick={handleSave}
              className="w-full h-[40px] mt-8 bg-[#448502] text-white rounded-md font-[Inter] font-bold text-sm hover:bg-[#3C7602] active:bg-[#2F5D01] disabled:opacity-40 disabled:pointer-events-none"
            >
              Crear publicación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
