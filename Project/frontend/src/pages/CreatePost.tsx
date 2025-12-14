import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { showToast } from "@/lib/toast";
import { createMarketplacePost, getCategories } from "@/services/postsService";
import type { Category } from "@/types/category";

type FormState = {
  title: string;
  content: string;
  price: number | string;
  quantity: number | string;
  unit_of_measure: string;
};

const MAX_IMAGES = 3;

export const CreatePost: React.FC = () => {
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  type FormErrors = {
    title?: string;
    content?: string;
    price?: string;
    quantity?: string;
  };

  const [errors, setErrors] = useState<FormErrors>({});
  const validateTitle = (value: string) => {
    if (value.length === 0) return "El título es obligatorio";
    if (value.length > 30) return "Máximo 30 caracteres";
    return "";
  };

  const validateContent = (value: string) => {
    if (value.length > 1000) return "Máximo 1000 caracteres";
    return "";
  };

  const validatePrice = (value: number | string) => {
    const n = Number(value);
    if (isNaN(n)) return "Precio inválido";
    if (n < 0 || n > 100_000_000) return "Debe estar entre 0 y 100.000.000";
    return "";
  };

  const validateQuantity = (value: number | string) => {
    const n = Number(value);
    if (isNaN(n)) return "Cantidad inválida";
    if (n < 0 || n > 100_000_000) return "Debe estar entre 0 y 100.000.000";
    return "";
  };
  const [form, setForm] = useState<FormState>({
    title: "",
    content: "",
    price: "",
    quantity: 0,
    unit_of_measure: "unidad",
  });

  /* ---------------- CARGAR CATEGORÍAS ---------------- */
  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      try {
        const data = await getCategories(controller.signal);
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching categories", err);
        }
      }
    };

    loadCategories();
    return () => controller.abort();
  }, []);

  /* ---------------- HANDLERS ---------------- */
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value === "" ? "" : Number(value));
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selected = Array.from(e.target.files);

    if (selected.length > MAX_IMAGES) {
      showToast("error", "Máximo 3 imágenes permitidas");
      return;
    }

    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
    setCurrentImageIndex(0);
  };

  const hasMultipleImages = previews.length > 1;

  const handleNextImage = () => {
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev + 1) % previews.length);
  };

  const handlePrevImage = () => {
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? previews.length - 1 : prev - 1,
    );
  };
  const formatPrice = (value: string | number) => {
    if (value === "" || value === null) return "";
    const number = Number(value);
    if (isNaN(number)) return "";
    return number.toLocaleString("es-CO");
  };

  const parsePrice = (value: string) => {
    return value.replace(/\./g, "").replace(/,/g, "");
  };
  /* ---------------- GUARDAR ---------------- */
  const handleSave = async () => {
    const newErrors: FormErrors = {
      title: validateTitle(form.title),
      content: validateContent(form.content),
      price: validatePrice(form.price),
      quantity: validateQuantity(form.quantity),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      showToast("error", "Corrige los errores del formulario");
      return;
    }
    const formData = new FormData();

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
      await createMarketplacePost(formData);
      showToast("success", "Post creado correctamente.");
      setTimeout(() => navigate("/my_products"), 2000);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showToast("error", "Error al crear el post: " + message);
    }
  };

  /* ---------------- JSX ---------------- */
  return (
    <div className="w-full min-h-screen bg-gray-50 px-8 py-10 flex flex-col gap-10">
      <h1 className="font-[Outfit] text-[30px] font-bold text-neutral-900">
        Crear nuevo post de venta
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ----------- IMÁGENES ----------- */}
        <div className="bg-white shadow-sm rounded-xl p-6">
          <h2 className="font-[Outfit] text-[20px] font-semibold text-neutral-900">
            Imágenes del producto
          </h2>

          <p className="font-[Inter] text-[14px] text-neutral-600 mt-2">
            Sube hasta 3 imágenes.
          </p>

          <div className="mt-4 border-2 border-dashed border-neutral-300 rounded-xl w-full h-[580px] flex items-center justify-center relative bg-neutral-200/20">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {previews.length > 0 ? (
              <img
                src={previews[currentImageIndex]}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl pointer-events-none"
              />
            ) : (
              <p className="font-[Inter] text-neutral-600 text-center px-4">
                Arrastra o haz clic para subir imágenes
              </p>
            )}

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow"
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>

        {/* ----------- FORMULARIO ----------- */}
        <div className="bg-white shadow-sm rounded-xl p-6">
          <h2 className="font-[Outfit] text-[20px] font-semibold text-neutral-900">
            Información del post
          </h2>

          <div className="mt-6">
            <label className="font-[Inter] text-sm font-medium">Título</label>
            <input
              type="text"
              maxLength={30}
              className={`w-full h-[49px] px-3 border rounded-md mt-1
    ${errors.title ? "border-red-500" : "border-neutral-300"}`}
              value={form.title}
              onChange={(e) => {
                const value = e.target.value;
                setForm((p) => ({ ...p, title: value }));
                setErrors((p) => ({ ...p, title: validateTitle(value) }));
              }}
            />

            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="font-[Inter] text-sm font-medium">
              Descripción
            </label>
            <textarea
              maxLength={1000}
              className={`w-full h-[120px] px-3 py-2 border rounded-md mt-1
    ${errors.content ? "border-red-500" : "border-neutral-300"}`}
              value={form.content}
              onChange={(e) => {
                const value = e.target.value;
                setForm((p) => ({ ...p, content: value }));
                setErrors((p) => ({ ...p, content: validateContent(value) }));
              }}
            />

            {errors.content && (
              <p className="text-xs text-red-600 mt-1">{errors.content}</p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-1 relative">
            <label className="font-[Inter] text-sm font-medium text-neutral-900">
              Precio
            </label>

            <input
              type="text"
              inputMode="numeric"
              className={`w-full h-[49px] pl-9 pr-3 border rounded-md
      ${errors.price ? "border-red-500" : "border-neutral-300"}`}
              value={formatPrice(form.price)}
              onChange={(e) => {
                const raw = parsePrice(e.target.value);

                if (!/^\d*$/.test(raw)) return; // solo números

                const numericValue = Number(raw);
                if (numericValue > 100_000_000) return;

                setForm((p) => ({ ...p, price: raw }));
                setErrors((p) => ({ ...p, price: validatePrice(raw) }));
              }}
            />

            <span className="absolute left-3 top-[46px] font-bold text-neutral-600">
              $
            </span>

            {errors.price && (
              <p className="text-xs text-red-600 mt-1">{errors.price}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="font-[Inter] text-sm font-medium">Cantidad</label>
            <input
              type="number"
              min={1}
              max={100_000_000}
              className={`w-full h-[49px] px-3 border rounded-md mt-1
              ${errors.quantity ? "border-red-500" : "border-neutral-300"}`}
              value={form.quantity}
              onChange={(e) => {
                const value = e.target.value;
                const raw = parsePrice(e.target.value);
                if (!/^\d*$/.test(raw)) return;
                setForm((p) => ({ ...p, quantity: value }));
                setErrors((p) => ({ ...p, quantity: validateQuantity(value) }));
              }}
            />

            {errors.quantity && (
              <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="font-[Inter] text-sm font-medium">
              Unidad de medida
            </label>
            <input
              className="w-full h-[49px] px-3 border rounded-md mt-1"
              maxLength={30}
              value={form.unit_of_measure}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  unit_of_measure: e.target.value,
                }))
              }
            />
          </div>

          <div className="mt-6">
            <label className="font-[Inter] text-sm font-medium">
              Categoría
            </label>
            <select
              className="w-full h-[40px] border rounded-md mt-1"
              value={selectedCategory === "" ? "" : String(selectedCategory)}
              onChange={handleCategoryChange}
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            className="w-full h-[40px] mt-8 bg-[#448502] text-white rounded-md font-bold hover:bg-[#3C7602]"
          >
            Crear publicación
          </button>
        </div>
      </div>
    </div>
  );
};
