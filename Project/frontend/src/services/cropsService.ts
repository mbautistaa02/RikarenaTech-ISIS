import type { CropItem } from "@/types/crop";

import { apiClient } from "./apiClient";

type CropsParams = {
  search?: string;
  product?: number;
  ordering?: string;
};

interface CreateCropPayload {
  product: number | string;
  start_date: string;
  harvest_date: string;
  area: number | string;
  crop_type: string;
  fertilizer_type?: "none" | "organic" | "chemical" | "mixed";
  production_qty: number | string;
  irrigation_method?: "none" | "gravity" | "drip" | "sprinkler" | "other";
  notes?: string;
}

// Opciones dinámicas para riego
export interface IrrigationOption {
  id: string;
  label: string;
}

export const getIrrigationMethods = (): IrrigationOption[] => [
  { id: "none", label: "Ninguno" },
  { id: "gravity", label: "Gravedad" },
  { id: "drip", label: "Riego por goteo" },
  { id: "sprinkler", label: "Aspersor" },
  { id: "other", label: "Otro" },
];

// Opciones dinámicas para fertilizante
export interface FertilizerOption {
  id: string;
  label: string;
}

export const getFertilizerTypes = (): FertilizerOption[] => [
  { id: "none", label: "Ninguno" },
  { id: "organic", label: "Orgánico" },
  { id: "chemical", label: "Químico" },
  { id: "mixed", label: "Mixto" },
];

// Tipo para opciones de producto
export interface ProductOption {
  id: number;
  label: string;
}

export const getCrops = (params: CropsParams = {}, signal?: AbortSignal) => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.product) query.set("product", String(params.product));
  if (params.ordering) query.set("ordering", params.ordering);

  const qs = query.toString();
  const path = `/crops/${qs ? `?${qs}` : ""}`;
  return apiClient.get<CropItem[]>(path, signal);
};

export const getCrop = (id: string | number, signal?: AbortSignal) =>
  apiClient.get<CropItem>(`/crops/${id}/`, signal);

export const getProducts = async (signal?: AbortSignal) => {
  try {
    const response = await apiClient.get<any>(`/crops/products/`, signal);
    console.log("Respuesta cruda de /crops/products/:", response);

    // Mapear respuesta a ProductOption
    let productsList: ProductOption[] = [];

    if (response.results && Array.isArray(response.results)) {
      // Si es paginado (con results)
      productsList = response.results.map((p: any) => ({
        id: p.product_id,
        label: p.name,
      }));
    } else if (Array.isArray(response)) {
      // Si es un array directo
      productsList = response.map((p: any) => ({
        id: p.product_id,
        label: p.name,
      }));
    }

    return productsList;
  } catch (error) {
    console.error("Error en getProducts:", error);
    return [];
  }
};

// Obtener un producto específico por ID
export const getProductById = async (
  id: number,
  signal?: AbortSignal,
): Promise<ProductOption | null> => {
  try {
    const response = await apiClient.get<any>(`/crops/products/${id}/`, signal);
    console.log(`Producto obtenido (ID ${id}):`, response);

    if (response && response.product_id && response.name) {
      return {
        id: response.product_id,
        label: response.name,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error obteniendo producto ${id}:`, error);
    return null;
  }
};

export const createCrop = (payload: CreateCropPayload) => {
  return apiClient.post(`/crops/`, payload);
};

export const getMyCrops = (signal?: AbortSignal) =>
  apiClient.get<CropItem[]>(`/crops/`, signal);

export const patchMyCrop = (
  id: string | number,
  payload: Partial<CreateCropPayload>,
) => {
  return apiClient.patch(`/crops/${id}/`, payload);
};

export const deleteMyCrop = (id: number, signal?: AbortSignal) => {
  return apiClient.delete<{ success: boolean }>(`/crops/${id}/`, signal);
};
