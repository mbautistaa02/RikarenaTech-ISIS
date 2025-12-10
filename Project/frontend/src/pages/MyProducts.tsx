import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { confirmToast } from "@/lib/button_toast.tsx";
import { showToast } from "@/lib/toast.ts";
import {
  getMyCrops,
  deleteMyCrop,
  getProductById,
} from "@/services/cropsService.ts";
import {
  deleteMarketplacePost,
  getMyPosts,
  markPostAsSold,
} from "@/services/postsService.ts";
import { getCurrentUserProfile } from "@/services/profileService";
import type { CropItem } from "@/types/crop.ts";
import { getFertilizerLabel, getIrrigationLabel } from "@/types/crop.ts";
import type { PostItem } from "@/types/post.ts";
import type { CurrentUser } from "@/types/profile";

export const MyProducts: React.FC = () => {
  const [myInfo, setMyInfo] = useState<CurrentUser | null>(null);
  const [items, setItems] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const loadProfile = async () => {
      try {
        const info = await getCurrentUserProfile(controller.signal);
        setMyInfo(info);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching profile", err);
          showToast(
            "error",
            "No se pudo cargar tu perfil. Intenta nuevamente.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => controller.abort();
  }, []);

  const fetchData = async () => {
    const controller = new AbortController();
    setLoading(true);
    try {
      const data = await getMyPosts(controller.signal);
      if (Array.isArray(data)) {
        // @ts-ignore
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("Error fetching posts", err);
        setItems([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = await confirmToast(
      "¿Seguro quieres eliminar este producto?",
    );
    if (!confirmed) return;

    try {
      await deleteMarketplacePost(id);
      showToast("success", "Producto eliminado correctamente.");
      // Remover el producto eliminado del estado
      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
    } catch (err) {
      console.error("Error eliminando el post:", err);
      showToast("error", "No se pudo eliminar el producto.");
    }
  };

  const handleMarkAsSold = async (id: number) => {
    const confirmed = await confirmToast("¿Marcar este producto como vendido?");
    if (!confirmed) return;

    try {
      await markPostAsSold(id);
      showToast("success", "Producto marcado como vendido.");
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "sold", is_available: false }
            : item,
        ),
      );
    } catch (err) {
      console.error("Error marcando como vendido:", err);
      showToast("error", "No se pudo marcar el producto como vendido.");
    }
  };

  const handleDeleteCrop = async (id: number) => {
    const confirmed = await confirmToast(
      "¿Seguro quieres eliminar este cultivo?",
    );
    if (!confirmed) return;

    try {
      await deleteMyCrop(id);
      showToast("success", "Cultivo eliminado correctamente.");
      // Remover el cultivo eliminado del estado
      setCrops((prev) => prev.filter((crop) => crop.crop_id !== id));
    } catch (err) {
      console.error("Error eliminando el cultivo:", err);
      showToast("error", "No se pudo eliminar el cultivo.");
    }
  };
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [productNames, setProductNames] = useState<Record<number, string>>({});

  useEffect(() => {
    const controller = new AbortController();
    const loadCrops = async () => {
      try {
        console.log("Cargando crops desde /crops/...");
        const data = await getMyCrops(controller.signal);
        console.log("Crops obtenidos:", data);
        if (Array.isArray(data)) {
          setCrops(data);

          // Obtener nombres de productos para cada crop
          const names: Record<number, string> = {};
          for (const crop of data) {
            if (typeof crop.product === "number") {
              // Si product es un número, obtener el nombre del API
              const productInfo = await getProductById(
                crop.product,
                controller.signal,
              );
              if (productInfo) {
                names[crop.product] = productInfo.label;
              } else {
                names[crop.product] = `Producto #${crop.product}`;
              }
            } else if (typeof crop.product === "object" && crop.product.name) {
              // Si product ya es un objeto con nombre, usar ese
              names[crop.product.product_id] = crop.product.name;
            }
          }
          setProductNames(names);
        } else {
          setCrops([]);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching crops", err);
          setCrops([]);
        }
      }
    };
    loadCrops();
    return () => controller.abort();
  }, []);
  if (loading) {
    return (
      <div className="w-full flex bg-gray-50 justify-center px-4 py-12">
        <div className="animate-pulse text-neutral-500">Cargando perfil...</div>
      </div>
    );
  }
  return (
    <section className="w-full bg-neutral-50 flex flex-col items-center">
      {/* DESC PROFILE*/}
      <section className="w-full bg-neutral-50 flex flex-col items-center">
        <div className="w-full bg-neutral-50  px-8 md:px-32 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8">
            {/* Vendedor */}

            <div className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col items-center overflow-hidden">
              {/* Imagen */}
              <img
                src={myInfo?.profile?.picture_url || "/farmer.jpg"}
                alt="Producto"
                className="w-30 h-30 rounded-full mt-4 object-cover"
              />
              {/* Contenido */}
              <div className="mb-4 text-center">
                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                  {myInfo?.username || "farmer"}
                </h3>
                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2 ml-4 mr-4">
                  {myInfo?.profile?.bio || "farmer"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Texto productos */}
      <div className="w-full p-4 md:px-15">
        <h2 className="mt-8 px-16 text-center md:text-left text-2xl md:text-[30px] leading-8 md:leading-9 font-[Outfit] font-bold text-neutral-900">
          Mis productos en venta
        </h2>
      </div>
      {/* Mis productos desde MockAPI */}
      <div className="w-full bg-neutral-50 px-8 md:px-32 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items
            .filter((item) => item.is_available !== false)
            .map((item) => (
              <div
                key={item["id"]}
                className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col overflow-hidden"
              >
                {/* Imagen */}
                <img
                  src={
                    item.images && item.images.length > 0
                      ? item.images[0].image
                      : "/blueberry.png"
                  }
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />

                {/* Contenido */}
                <div className="p-4 flex flex-col gap-3">
                  <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900">
                    {item.title}
                  </h3>

                  <p className="font-[Inter] text-[14px] text-neutral-600">
                    {item.desc}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-green-600 leading-none">
                      ${item.price}
                    </span>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        title={
                          item.status === "sold"
                            ? "Producto vendido"
                            : "Marcar como vendido"
                        }
                        className="h-10 px-3 bg-[#E5E7EB] hover:bg-[#D1D5DB] active:bg-[#9CA3AF] text-[#111827] border border-transparent rounded-lg transition flex items-center justify-center"
                        onClick={() => handleMarkAsSold(item.id)}
                        disabled={item.status === "sold"}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                      <Link
                        to={`/edit_post/${item["id"]}`}
                        title="Editar publicación"
                        className="h-10 px-3 bg-[#5bc786] hover:bg-[#43ae6e] active:bg-[#43ae6e] text-white border border-transparent rounded-lg transition flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H3v-4.5L16.732 3.732z"
                          />
                        </svg>
                      </Link>
                      <button
                        title="Eliminar publicación"
                        className="h-10 px-3 bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white border border-transparent rounded-lg transition flex items-center justify-center"
                        onClick={() => handleDelete(item.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-3 0h14"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Texto crops */}
      <div className="w-full px-4 md:px-15">
        <h2 className="mt-8 px-16 text-center md:text-left text-2xl md:text-[30px] leading-8 md:leading-9 font-[Outfit] font-bold text-neutral-900">
          Mis cultivos
        </h2>
      </div>

      {/* Mis crops desde MockAPI */}
      {/* Mis crops desde MockAPI */}
      <div className="w-full bg-neutral-50 px-8 md:px-32 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8 px-20">
          {crops.map((crop) => (
            <div
              key={crop.crop_id}
              className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col items-start overflow-hidden p-6"
            >
              {/* Contenido */}
              <div className="w-full">
                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-2">
                  {typeof crop.product === "number"
                    ? productNames[crop.product] || `Producto #${crop.product}`
                    : crop.product.name || "Sin producto"}
                </h3>

                <p className="font-[Inter] text-[14px] text-neutral-600 mb-3">
                  Tipo: <span className="font-semibold">{crop.crop_type}</span>
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-neutral-600">Área</p>
                    <p className="font-semibold text-neutral-900">
                      {crop.area} ha
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600">Producción</p>
                    <p className="font-semibold text-neutral-900">
                      {crop.production_qty}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600">Inicio</p>
                    <p className="font-semibold text-neutral-900">
                      {new Date(crop.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600">Cosecha</p>
                    <p className="font-semibold text-neutral-900">
                      {new Date(crop.harvest_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {crop.fertilizer_type && (
                  <p className="font-[Inter] text-[14px] text-neutral-600 mb-2">
                    Fertilizante:{" "}
                    <span className="font-semibold">
                      {getFertilizerLabel(crop.fertilizer_type)}
                    </span>
                  </p>
                )}

                {crop.irrigation_method && (
                  <p className="font-[Inter] text-[14px] text-neutral-600 mb-3">
                    Riego:{" "}
                    <span className="font-semibold">
                      {getIrrigationLabel(crop.irrigation_method)}
                    </span>
                  </p>
                )}

                {crop.notes && (
                  <p className="font-[Inter] text-[14px] text-neutral-600 mb-4">
                    Notas: <span>{crop.notes}</span>
                  </p>
                )}

                {/* Botones */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => handleDeleteCrop(crop.crop_id)}
                    className="bg-[#B2373F] hover:bg-[#992F36] active:bg-[#7F262C]
                                       text-white border border-neutral-300 px-4 py-2 rounded-xl transition text-sm"
                  >
                    Eliminar
                  </button>

                  <Link
                    to={`/edit_crop/${crop.crop_id}`}
                    className="bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01]
                                       text-white border border-neutral-300 px-4 py-2 rounded-xl transition text-sm"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
