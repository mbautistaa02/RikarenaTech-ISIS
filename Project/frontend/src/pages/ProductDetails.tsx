import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import defaultAvatar from "@/assets/default-avatar.svg";
import { getMarketplacePost } from "@/services/postsService";
import { getSeller } from "@/services/sellersService";
import type { PostItem } from "@/types/post";
import type { Seller } from "@/types/seller";

export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [item, setItem] = useState<PostItem | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMarketplacePost(id, controller.signal);
        setItem(data);
        if (data && (data as any).user?.username) {
          const username = (data as any).user.username as string;
          const sellerData = await getSeller(username, controller.signal);
          setSeller(sellerData);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching product detail", err);
          setError("No se pudo cargar el producto.");
          setItem(null);
          setSeller(null);
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
    // Preload all product images for smoother navigation
    if (item?.images && item.images.length > 0) {
      item.images.forEach((img) => {
        const preload = new Image();
        preload.src = img.image;
      });
    }
  }, [item]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [item]);

  if (loading) {
    return <div className="p-10 text-center">Cargando...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-600">{error}</div>;
  }

  if (!item || !seller) {
    return (
      <div className="p-10 text-center text-neutral-600">
        Producto no encontrado.
      </div>
    );
  }

  const images =
    item.images && item.images.length > 0
      ? item.images
      : [{ image: "/placeholder-no-image.svg" }];
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex] ?? images[0];
  const sellerImage = seller.profile?.picture_url || defaultAvatar;

  const handleNextImage = () => {
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div>
      <div className="w-full py-3 px-20 bg-neutral-50">
        <button
          onClick={() => navigate("/products")}
          className="hidden sm:flex items-center justify-center px-4 py-2 h-9 rounded-md bg-[#448502] text-white text-sm font-medium hover:bg-[#3C7602] active:bg-[#2F5D01] font-[Inter] transition"
        >
          <span className="text-2xl">←</span>
        </button>
      </div>

      <div className="w-full bg-neutral-50 flex flex-col lg:flex-row lg:gap-16 px-4 lg:px-20 py-2 overflow-visible">
        <div className="flex items-center relative">
          <img
            src={currentImage.image}
            alt={item.title}
            className="w-full max-w-[600px] max-h-[400px] h-auto rounded-2xl object-cover mx-auto lg:mx-0"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = "/placeholder-no-image.svg";
            }}
          />

          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-neutral-700 rounded-full p-2 shadow transition"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-neutral-700 rounded-full p-2 shadow transition"
              >
                →
              </button>
            </>
          )}
        </div>

        <div className="mt-10 lg:mt-0 flex lg:max-w-1/2 flex-col">
          <h1
            className="font-[Outfit] text-[28px] leading-[34px] font-bold text-neutral-900
                   lg:text-[36px] lg:leading-[40px]"
          >
            {item.title}
          </h1>

          <h2
            className="font-[Outfit] text-[24px] leading-[30px] font-semibold text-[#448502]
                   mt-3
                   lg:text-[30px] lg:leading-[36px]"
          >
            {item.price}
          </h2>

          <p
            className="font-[Inter] text-[16px] leading-[25px] text-neutral-600 mt-6 max-w-[90%] mx-auto lg:mx-0
                  lg:text-[18px] lg:leading-[29px] lg:w-[592px]"
          >
            {item.desc || item.content}
          </p>

          <div className="flex">
            <p
              className="font-[Inter] text-[14px] leading-[22px] font-medium text-neutral-900 mt-6
                  lg:text-[16px] lg:leading-[24px]"
            >
              Este producto es vendido por:
            </p>
            <p
              className="font-[Inter] text-[14px] leading-[22px] font-medium text-[#448502] mt-6
                  lg:text-[16px] lg:leading-[24px] px-2"
            >
              {seller.username}
            </p>
          </div>

          <button
            className=" mt-6 w-full max-w-[592px] h-[48px] px-3 border border-[#448502] rounded-md justify-center
        font-[Inter] text-[16px] lg:text-[18px] font-semibold text-[#448502] bg-neutral-50 hover:bg-neutral-100 active:bg-white"
          >
            Contactar al vendedor (proximamente)
          </button>
        </div>
      </div>

      <section className="w-full bg-neutral-50 flex flex-col items-center">
        <div className="w-full bg-neutral-50  px-8 md:px-32 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8">
            <div className="relative bg-[#EEFFDEFF] rounded-xl shadow-sm border border-transparent flex flex-col items-center overflow-hidden">
              <img
                src={sellerImage}
                alt={`Foto de ${seller.username}`}
                className="w-30 h-30 rounded-full mt-4 object-cover"
              />
              <div className="mb-4 text-center">
                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                  {seller.username}
                </h3>
                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2 ml-4 mr-4">
                  {seller.profile?.bio ||
                    "Este vendedor aún no tiene biografía."}
                </p>
                <Link
                  to={`/products-by-seller/${seller.username}`}
                  className="bg-[#83592EFF] hover:bg-[#6C4926FF] text-white border border-neutral-300 active:bg-[#53381DFF] px-4 py-2 rounded-xl transition"
                >
                  Ver publicaciones
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
