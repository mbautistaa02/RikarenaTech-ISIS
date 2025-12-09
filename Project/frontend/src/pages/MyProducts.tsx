import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCurrentUserProfile,
} from "@/services/profileService";
import type { CurrentUser } from "@/types/profile";
import { showToast } from "@/lib/toast.ts";
import { getMyPosts } from "@/services/postsService.ts";
import type { PostItem } from "@/types/post.ts";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const [crops, setCrops] = useState([]);

  useEffect(() => {
    //Cambiar a crops en la conexión con backend
    fetch("https://6917819021a96359486d20a1.mockapi.io/api/v1/products")
      .then((r) => r.json())
      .then((data) => setCrops(data));
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
          {items.map((item) => (
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
              <div className="p-4">
                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                  {item.title}
                </h3>

                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2">
                  {item.desc}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-bold text-green-600">
                    ${item.price}
                  </span>
                  <div>
                    <button className="bg-[#B2373F] hover:bg-[#992F36] active:bg-[#7F262C] text-white border border-neutral-300 px-4 py-2 rounded-xl transition">
                      Eliminar
                    </button>
                    <Link
                      to={`/edit_post/${item["id"]}`}
                      className="bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01] text-white border border-neutral-300 px-4 py-2 rounded-xl transition"
                    >
                      Editar
                    </Link>
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
              key={crop["id"]}
              className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col items-center overflow-hidden"
            >
              {/* Imagen */}
              <img
                src={crop["image"] || "/blueberry.png"}
                alt={crop["name"]}
                className="w-30 h-30 rounded-full mt-4 object-cover"
              />

              {/* Contenido */}
              <div className="mb-4 text-center px-4">
                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                  {crop["name"]}
                </h3>

                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2">
                  {crop["desc"]}
                </p>

                {/* Botones */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    className="bg-[#B2373F] hover:bg-[#992F36] active:bg-[#7F262C]
                                       text-white border border-neutral-300 px-4 py-2 rounded-xl transition"
                  >
                    Eliminar
                  </button>

                  <Link
                    to={`/edit_post/${crop["id"]}`}
                    className="bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01]
                                       text-white border border-neutral-300 px-4 py-2 rounded-xl transition"
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
