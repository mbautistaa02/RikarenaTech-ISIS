import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import defaultAvatar from "@/assets/default-avatar.svg";
import { showToast } from "@/lib/toast";
import { getSellers } from "@/services/sellersService";
import type { Seller } from "@/types/seller";

export const Sellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const data = await getSellers({}, controller.signal);
        setSellers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching sellers", err);
          setSellers([]);
          const message =
            err instanceof Error && err.message
              ? err.message
              : "Debes iniciar sesión para ver vendedores. Inicia sesión e inténtalo de nuevo.";
          showToast("error", message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const fetchSellers = async () => {
    const controller = new AbortController();
    setLoading(true);
    try {
      const data = await getSellers(
        { search: search || undefined },
        controller.signal,
      );
      setSellers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("Error fetching sellers", err);
        setSellers([]);
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Debes iniciar sesión para ver vendedores. Inicia sesión e inténtalo de nuevo.";
        showToast("error", message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSubmitSearch = () => {
    fetchSellers();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitSearch();
    }
  };

  const getSellerImage = (seller: Seller) =>
    seller.profile?.picture_url || defaultAvatar;

  return (
    <section className="w-full bg-neutral-50 flex flex-col py-4 items-center">
      {/* Bloque de búsqueda y categorías */}
      <div
        className="w-full max-w-[1184px] relative bg-neutral-100 rounded-xl border border-neutral-200 shadow-md
                px-4 py-4 flex flex-wrap items-center justify-between gap-4"
      >
        {/* Campo de búsqueda */}
        <div className="flex items-center w-[300px] md:w-2/4 lg:w-5/8">
          <input
            type="text"
            placeholder="Buscar vendedores..."
            className="flex-1 h-10 px-3 text-sm outline-none font-[Inter] border border-neutral-300 border-r-0 rounded-l-md"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSubmitSearch}
            className="h-10 w-10 bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01] text-white flex items-center justify-center rounded-r-md border border-neutral-400 border-l-0"
          >
            {/* Ícono de búsqueda SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </button>
        </div>

        {/* 🔸 Ordenar por (default: Nombre) */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-900 font-[Inter] font-medium text-base"></span>
        </div>
      </div>
      {/* Grid vendedores */}
      <div className="w-full bg-neutral-50  px-8 md:px-32 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Vendedores */}
          {loading && (
            <div className="text-neutral-500 text-center col-span-full">
              Buscando vendedores...
            </div>
          )}
          {!loading && sellers.length === 0 && (
            <div className="text-neutral-500 text-center col-span-full">
              No se encontraron vendedores.
            </div>
          )}
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="relative bg-white rounded-xl shadow-lg border border-neutral-200 flex flex-col items-center overflow-hidden"
            >
              {/* Imagen */}
              <img
                src={getSellerImage(seller)}
                alt={`Foto de ${seller.username}`}
                className="w-30 h-30 rounded-full mt-4 object-cover"
              />

              {/* Contenido */}
              <div className="mb-4 text-center">
                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                  {seller.username}
                </h3>

                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2">
                  {seller.profile?.bio ||
                    "Este vendedor aún no tiene biografía."}
                </p>

                <Link
                  to={`/products-by-seller/${seller.username}`}
                  className="bg-white hover:bg-neutral-100 border border-neutral-300 active:bg-neutral-200 px-4 py-2 rounded-xl transition"
                >
                  Ver publicaciones
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
