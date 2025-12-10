import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { showToast } from "@/lib/toast";
import {
  getCrop,
  patchMyCrop,
  getProducts,
  getIrrigationMethods,
  getFertilizerTypes,
} from "@/services/cropsService";
import type { ProductOption } from "@/services/cropsService";

type FormState = {
  product: number | "";
  start_date: string;
  harvest_date: string;
  area: number | string;
  crop_type: string;
  fertilizer_type: "none" | "organic" | "chemical" | "mixed";
  production_qty: number | string;
  irrigation_method: "none" | "gravity" | "drip" | "sprinkler" | "other";
  notes: string;
};

export default function EditCrop() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [form, setForm] = useState<FormState>({
    product: "",
    start_date: "",
    harvest_date: "",
    area: "",
    crop_type: "",
    fertilizer_type: "none",
    production_qty: "",
    irrigation_method: "none",
    notes: "",
  });

  // Cargar productos y datos del cultivo al montar
  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        setIsLoadingData(true);

        // Cargar productos
        console.log("Cargando productos...");
        const productsList = await getProducts(controller.signal);
        console.log("Productos cargados:", productsList);
        if (productsList && productsList.length > 0) {
          setProducts(productsList);
        }

        // Cargar datos del cultivo
        if (id) {
          console.log(`Cargando cultivo con ID ${id}...`);
          const cropData = await getCrop(id, controller.signal);
          console.log("Cultivo cargado:", cropData);

          if (cropData) {
            setForm({
              product:
                cropData.product && typeof cropData.product === "object"
                  ? cropData.product.product_id
                  : (cropData.product as number),
              start_date: cropData.start_date,
              harvest_date: cropData.harvest_date,
              area: cropData.area,
              crop_type: cropData.crop_type,
              fertilizer_type:
                (cropData.fertilizer_type as
                  | "none"
                  | "organic"
                  | "chemical"
                  | "mixed") || "none",
              production_qty: cropData.production_qty,
              irrigation_method:
                (cropData.irrigation_method as
                  | "none"
                  | "gravity"
                  | "drip"
                  | "sprinkler"
                  | "other") || "none",
              notes: cropData.notes || "",
            });
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error loading data:", err);
          showToast("error", "Error al cargar los datos");
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
    return () => controller.abort();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    // Validar campos requeridos
    if (form.product === "" || !form.product) {
      showToast("error", "Debes seleccionar un producto.");
      return;
    }
    if (!form.start_date.trim()) {
      showToast("error", "La fecha de inicio es requerida.");
      return;
    }
    if (!form.harvest_date.trim()) {
      showToast("error", "La fecha de cosecha es requerida.");
      return;
    }
    if (form.area === "" || Number(form.area) <= 0) {
      showToast("error", "El área debe ser un número positivo.");
      return;
    }
    if (!form.crop_type.trim()) {
      showToast("error", "El tipo de cultivo es requerido.");
      return;
    }
    if (form.production_qty === "" || Number(form.production_qty) <= 0) {
      showToast(
        "error",
        "La cantidad de producción debe ser un número positivo.",
      );
      return;
    }

    // Validar que harvest_date sea después de start_date
    if (new Date(form.harvest_date) <= new Date(form.start_date)) {
      showToast(
        "error",
        "La fecha de cosecha debe ser posterior a la de inicio.",
      );
      return;
    }

    if (!id) {
      showToast("error", "ID del cultivo no encontrado.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        product: Number(form.product),
        start_date: form.start_date,
        harvest_date: form.harvest_date,
        area: Number(form.area),
        crop_type: form.crop_type,
        fertilizer_type: form.fertilizer_type,
        production_qty: Number(form.production_qty),
        irrigation_method: form.irrigation_method,
        notes: form.notes,
      };

      console.log("Enviando payload para actualizar:", payload);
      await patchMyCrop(id, payload);
      showToast("success", "Cultivo actualizado correctamente.");

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/my_products");
      }, 2000);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showToast("error", "Error al actualizar el cultivo: " + message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-pulse text-neutral-500">
          Cargando datos del cultivo...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 px-8 flex flex-col gap-10">
      <div className="w-full min-h-screen bg-gray-50 py-10 flex flex-col gap-10">
        {/* Título */}
        <h1 className="font-[Outfit] text-[30px] font-bold text-neutral-900">
          Editar cultivo
        </h1>

        {/* Contenedor principal */}
        <div className="lg:px-30 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA - INFORMACIÓN BÁSICA */}
          <div className="bg-white shadow-sm border border-green-700 rounded-xl p-6">
            <h2 className="font-[Outfit] text-[20px] font-semibold text-neutral-900">
              Información básica
            </h2>

            <p className="font-[Inter] text-[14px] text-neutral-600 mt-2">
              Datos principales del cultivo.
            </p>

            {/* Producto */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Producto *
              </label>
              {products.length > 0 ? (
                <select
                  name="product"
                  value={form.product}
                  onChange={handleInputChange}
                  className="
                  w-full h-[49px] px-3
                  font-[Inter] text-sm
                  bg-neutral-200/10 border border-neutral-300 rounded-md
                  hover:border-neutral-300
                  focus:outline-none focus:ring-2 focus:ring-neutral-300/30
                "
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full h-[49px] px-3 flex items-center bg-neutral-200/10 border border-neutral-300 rounded-md text-neutral-500">
                  Cargando productos...
                </div>
              )}
            </div>

            {/* Fecha de inicio */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Fecha de inicio *
              </label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleInputChange}
                className="
                w-full h-[49px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
              />
            </div>

            {/* Fecha de cosecha */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Fecha de cosecha *
              </label>
              <input
                type="date"
                name="harvest_date"
                value={form.harvest_date}
                onChange={handleInputChange}
                className="
                w-full h-[49px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
              />
            </div>

            {/* Área (hectáreas) */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Área (hectáreas) *
              </label>
              <input
                type="number"
                name="area"
                value={form.area}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                className="
                w-full h-[49px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
              />
            </div>

            {/* Tipo de cultivo */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Tipo de cultivo *
              </label>
              <input
                type="text"
                name="crop_type"
                value={form.crop_type}
                onChange={handleInputChange}
                placeholder="Ej: Cultivo hidropónico"
                className="
                w-full h-[49px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
              />
            </div>
          </div>

          {/* COLUMNA DERECHA - INFORMACIÓN OPERACIONAL */}
          <div className="bg-white shadow-sm border border-green-700 rounded-xl p-6">
            <h2 className="font-[Outfit] text-[20px] font-semibold text-neutral-900">
              Información operacional
            </h2>

            <p className="font-[Inter] text-[14px] text-neutral-600 mt-2">
              Detalles sobre la producción y mantenimiento.
            </p>

            {/* Cantidad de producción */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Cantidad de producción *
              </label>
              <input
                type="number"
                name="production_qty"
                value={form.production_qty}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                className="
                w-full h-[49px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
              />
            </div>

            {/* Tipo de fertilizante */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Tipo de fertilizante
              </label>
              <select
                name="fertilizer_type"
                value={form.fertilizer_type}
                onChange={handleInputChange}
                className="
                w-full h-[49px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
              >
                {getFertilizerTypes().map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Métod de riego */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Método de riego
              </label>
              <select
                name="irrigation_method"
                value={form.irrigation_method}
                onChange={handleInputChange}
                className="
                w-full h-[49px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
              >
                {getIrrigationMethods().map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notas */}
            <div className="mt-6 flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Notas adicionales
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                placeholder="Información adicional sobre el cultivo..."
                className="
                w-full h-[120px] px-3 py-2
                font-[Inter] text-sm text-neutral-900
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
              />
            </div>

            {/* Botón actualizar cultivo */}
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="
              w-full h-[40px] mt-8
              bg-[#448502] text-white rounded-md
              font-[Inter] font-bold text-sm
              hover:bg-[#3C7602]
              active:bg-[#2F5D01]
              disabled:opacity-40 disabled:pointer-events-none
              transition-colors
            "
            >
              {isLoading ? "Actualizando cultivo..." : "Actualizar cultivo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
