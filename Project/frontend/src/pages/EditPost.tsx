import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { showToast } from "@/lib/toast.ts";
import {
  getCategories,
  getMarketplacePost,
  patchMyPost,
} from "@/services/postsService.ts";
import type { Category } from "@/types/category.ts";
import type { PostItem } from "@/types/post.ts";

type FormState = {
  title: string;
  content: string;
  price: number | string;
  images: string;
  quantity: number | string;
  unit_of_measure: string;
};
export function EditPost() {
  const navigate = useNavigate();
  const [item, setItem] = useState<PostItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const { id } = useParams();
  const [form, setForm] = useState<FormState>({
    title: "",
    content: "",
    price: "",
    images: "",
    quantity: 0,
    unit_of_measure: "unidad",
  });
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMarketplacePost(id, controller.signal);
        setItem(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching product detail", err);
          setError("No se pudo cargar el producto.");
          setItem(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [id]);
  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        content: String(item.content),
        price: String(item.price),
        quantity: String(item.quantity),
        unit_of_measure: String(item.unit_of_measure),
        images: "",
      });
    }
  }, [item]);
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
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      if (!id) return;
      await patchMyPost(id, formData);
      showToast("success", "Post editado correctamente.");
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showToast("error", "Error al crear el post: " + message);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Cargando...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-600">{error}</div>;
  }

  if (!item) {
    return (
      <div className="p-10 text-center text-neutral-600">
        Producto no encontrado.
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 px-8  flex flex-col">
      <div className="w-full py-3 ">
        <button
          onClick={() => navigate("/my_products")}
          className="hidden sm:flex items-center justify-center px-4 py-2 h-9 rounded-md bg-[#448502] text-white text-sm font-medium hover:bg-[#3C7602] active:bg-[#2F5D01] font-[Inter] transition"
        >
          <span className="text-2xl">←</span>
        </button>
      </div>
      {item && (
        <div className="w-full min-h-screen bg-gray-50  flex flex-col gap-10">
          {/* Título */}
          <h1 className="font-[Outfit] text-[30px] font-bold text-neutral-900">
            Editar post
          </h1>

          {/* Contenedor principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 pb-20 gap-10">
            {/* ----------- COLUMNA IZQUIERDA ----------- */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <h2 className="font-[Outfit] text-[20px] font-semibold text-neutral-900">
                Imagen principal
              </h2>

              <p className="font-[Inter] text-[14px] text-neutral-600 mt-2">
                Esta es la imagen de tu publicación.
              </p>

              {/* Área de subida */}
              <div className="mt-2 border-2 border-neutral-300 border-dashed bg-neutral-200/20 rounded-xl w-full h-[580px] flex flex-col items-center justify-center">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0].image}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 text-neutral-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 16l4-5h-3V4h-2v7H8z" />
                    </svg>

                    <p className="mt-4 font-[Inter] text-[16px] text-neutral-600 text-center">
                      Arrastra aquí una imagen o haz clic para subir un archivo
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
                  defaultValue={item.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="
                w-full h-[49px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
                />
              </div>

              {/* ----- Campo: Descripción ----- */}
              <div className="mt-6 flex flex-col gap-1">
                <label className="font-[Inter] text-sm font-medium text-neutral-900">
                  Descripción
                </label>

                <textarea
                  defaultValue={item.content}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="
                w-full h-[120px] px-3 py-2
                font-[Inter] text-sm text-neutral-900
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
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
                  defaultValue={item.price}
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
                  defaultValue={item.quantity}
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
                  defaultValue={item.unit_of_measure}
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
                  value={
                    selectedCategory === "" ? "" : String(selectedCategory)
                  }
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

              {/* ----- Botón editar post ----- */}
              <button
                onClick={handleSave}
                className="
              w-full h-[40px] mt-8
              bg-[#448502] text-white rounded-md
              font-[Inter] font-bold text-sm
              hover:bg-[#3C7602]
              active:bg-[#2F5D01]
              disabled:opacity-40 disabled:pointer-events-none
            "
              >
                Editar publicación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
