import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const Home: React.FC = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/posts/marketplace/", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((data) => setItems(data));
  }, []);
  return (
    <section className="w-full  bg-neutral-50 flex flex-col items-center">
      {/* Banner */}
      <div className="relative w-full h-[350px]">
        <img
          src="/fruitsHome.png"
          alt="Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
        <div className="absolute inset-0 flex flex-col justify-center items-center">
          <h2 className="text-3xl font-[Outfit] font-bold text-white mb-2 text-center">
            Bienvenido a ISIS marketplace
          </h2>
          <p className="text-white font-[Inter] text-center">
            Explora los productos de nuestros vendedores destacados
          </p>
        </div>
      </div>

      {/* Bloque de búsqueda y categorías */}
      <div className="w-full max-w-[1184px] bg-neutral-100 border border-neutral-200 shadow-sm rounded-lg mt-10 px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* 🔸 Categorías */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-neutral-900 font-[Inter] font-medium text-lg">
            Categoría:
          </span>
          <button className="px-3 py-2 text-sm font-medium text-neutral-900 rounded-md hover:bg-neutral-200">
            Frutas
          </button>
          <button className="px-3 py-2 hidden sm:flex text-sm font-medium text-neutral-900 rounded-md hover:bg-neutral-200">
            Verduras
          </button>
        </div>

        {/* 🔸 Campo de búsqueda */}
        <div className="flex items-center w-[300px]">
          <input
            type="text"
            placeholder="Buscar producto..."
            className="flex-1 h-10 px-3 text-sm outline-none font-[Inter] border border-neutral-300 border-r-0 rounded-l-md"
          />
          <button className="h-10 w-10 bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01] text-white flex items-center justify-center rounded-r-md border border-neutral-400 border-l-0">
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

        {/* 🔸 Ordenar por */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-900 font-[Inter] font-medium text-base">
            Sort by:
          </span>
          <div className="relative">
            <select className="appearance-none w-[180px] h-10 px-3 pr-8 border border-neutral-300 rounded-md font-[Inter] text-sm text-neutral-900 focus:outline-none">
              <option>Más recientes</option>
              <option>Precio: menor a mayor</option>
              <option>Precio: mayor a menor</option>
            </select>
            {/* Ícono de flecha hacia abajo SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Texto */}
      <div className="w-full px-4 md:px-15">
        <h2 className="mt-8 text-center md:text-left text-2xl md:text-[30px] leading-8 md:leading-9 font-[Outfit] font-bold text-neutral-900">
          Fresh pick from local farms
        </h2>
      </div>

      {/* Todos productos desde back */}
      <div className="w-full bg-neutral-50 px-8 md:px-32 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(items as any)?.data?.map((item: any) => (
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
                alt={item["name"]}
                className="w-full h-48 object-cover"
              />

              {/* Contenido */}
              <div className="p-4">
                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                  {item["title"]}
                </h3>

                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2">
                  {item["desc"]}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-bold text-green-600">
                    ${item["price"]}
                  </span>

                  <Link
                    to={`/product_details/${item["id"]}`}
                    className="bg-white hover:bg-neutral-100 border border-neutral-300 active:bg-neutral-200 px-4 py-2 rounded-xl transition"
                  >
                    View product details
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
