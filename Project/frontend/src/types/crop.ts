export type Product = {
  product_id: number;
  name: string;
};

export type CropItem = {
  crop_id: number;
  product: number | Product;
  start_date: string;
  harvest_date: string;
  area: number;
  crop_type: string;
  fertilizer_type?: "none" | "organic" | "chemical" | "mixed";
  production_qty: number;
  irrigation_method?: "none" | "gravity" | "drip" | "sprinkler" | "other";
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export interface CreateCropPayload {
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

export const FERTILIZER_TYPES = [
  { value: "none", label: "Ninguno" },
  { value: "organic", label: "Orgánico" },
  { value: "chemical", label: "Químico" },
  { value: "mixed", label: "Mixto" },
];

export const IRRIGATION_METHODS = [
  { value: "none", label: "Sin riego" },
  { value: "gravity", label: "Gravedad" },
  { value: "drip", label: "Goteo" },
  { value: "sprinkler", label: "Aspersión" },
  { value: "other", label: "Otro" },
];

// Funciones auxiliares para obtener etiquetas en español
export const getFertilizerLabel = (value: string | undefined): string => {
  if (!value) return "Ninguno";
  const type = FERTILIZER_TYPES.find((t) => t.value === value);
  return type ? type.label : value;
};

export const getIrrigationLabel = (value: string | undefined): string => {
  if (!value) return "Sin riego";
  const method = IRRIGATION_METHODS.find((m) => m.value === value);
  return method ? method.label : value;
};
