import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import defaultAvatar from "@/assets/default-avatar.svg";
import { getSeller, getSellerPosts } from "@/services/sellersService";
import type { PostItem } from "@/types/post";
import type { Seller } from "@/types/seller";

export const ProductsBySeller = () => {
  const { id } = useParams();
  const username = id;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [items, setItems] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const statusStyles: Record<string, { label: string; classes: string }> = {
    active: { label: "Disponible", classes: "bg-green-100 text-green-800" },
    sold: { label: "Vendido", classes: "bg-neutral-200 text-neutral-800" },
    expired: { label: "Expirado", classes: "bg-neutral-200 text-neutral-800" },
    pending_review: {
      label: "En revisión",
      classes: "bg-amber-100 text-amber-800",
    },
    rejected: { label: "Rechazado", classes: "bg-red-100 text-red-800" },
    paused: { label: "Pausado", classes: "bg-neutral-200 text-neutral-800" },
  };

  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    const loadSeller = async () => {
      setLoadingSeller(true);
      try {
        const data = await getSeller(username, controller.signal);
        setSeller(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching seller", err);
          setSeller(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSeller(false);
        }
      }
    };

    loadSeller();
    return () => controller.abort();
  }, [username]);

  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    const loadPosts = async () => {
      setLoading(true);
      try {
        const data = await getSellerPosts(username, controller.signal);
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching seller posts", err);
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPosts();
    return () => controller.abort();
  }, [username]);
  const navigate = useNavigate();
  const sellerImage = seller?.profile?.picture_url || defaultAvatar;

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    const info = statusStyles[status.toLowerCase()];
    if (!info) return null;
    return (
      <span
        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${info.classes}`}
      >
        {info.label}
      </span>
    );
  };

  const filteredItems = items.filter(
    (item) =>
      (item.visibility === "public" || item.visibility === undefined) &&
      item.status !== "rejected",
  );
  return (
    <section className="w-full bg-neutral-50 flex flex-col items-center">
      <div className="w-full py-3 px-20">
        <button
          onClick={() => navigate("/sellers")}
          className="hidden sm:flex items-center justify-center px-4 py-2 h-9 rounded-md bg-[#448502] text-white text-sm font-medium hover:bg-[#3C7602] active:bg-[#2F5D01] font-[Inter] transition"
        >
          <span className="text-2xl">←</span>
        </button>
      </div>

      {/* Mi perfil desc */}
      <div className="w-full bg-neutral-50  px-8 md:px-32 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8">
          {loadingSeller && (
            <div className="text-neutral-500 text-center col-span-full">
              Cargando vendedor...
            </div>
          )}
          {!loadingSeller && seller && (
            <div className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col items-center overflow-hidden">
              <img
                src={sellerImage}
                alt={`Foto de ${seller.username}`}
                className="w-32 h-32 rounded-full mt-4 object-cover"
              />

              <div className="mb-4 text-center">
                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                  {seller.username}
                </h3>

                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2 ml-4 mr-4">
                  {seller.profile?.bio ||
                    "Este vendedor aún no tiene biografía."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Productos de vendedor con USERNAME */}
      <div className="w-full bg-neutral-50 px-8 md:px-32 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && (
            <div className="text-neutral-500 text-center col-span-full">
              Cargando publicaciones...
            </div>
          )}
          {!loading && filteredItems.length === 0 && (
            <div className="text-neutral-500 text-center col-span-full">
              No se encontraron publicaciones.
            </div>
          )}
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col overflow-hidden"
            >
              {renderStatusBadge(item.status)}
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
                  {item.desc || item.content}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-bold text-green-600">
                    ${item.price}
                  </span>

                  <Link
                    to={`/product_details/${item.id}`}
                    className="bg-white hover:bg-neutral-100 border border-neutral-300 active:bg-neutral-200 px-4 py-2 rounded-xl transition"
                  >
                    Ver detalle
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
