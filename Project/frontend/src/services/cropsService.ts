import type { CropItem, Product } from "@/types/crop";

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
    const response = await apiClient.get<Product>(`/crops/products/1/`, signal);
    console.log("Producto obtenido:", response);

    if (response && typeof response === "object") {
      // Devolver siempre el producto con ID 1 en un array
      return [response] as Product[];
    }

    console.warn("No se pudo obtener el producto, devolviendo array vacío");
    return [];
  } catch (error) {
    console.error("Error en getProducts:", error);
    throw error;
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
