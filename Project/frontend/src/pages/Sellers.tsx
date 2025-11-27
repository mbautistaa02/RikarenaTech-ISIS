import { useEffect, useState } from "react";
import {Link} from "react-router-dom";

export const Sellers = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetch("https://6917819021a96359486d20a1.mockapi.io/api/v1/sellers")
            .then(r => r.json())
            .then(data => setItems(data));
    }, []);

    return (
        <section className="w-full bg-neutral-50 flex flex-col py-4 items-center">

            {/* Bloque de búsqueda y categorías */}
            <div
                className="w-full max-w-[1184px] bg-neutral-100 rounded-xl border border-neutral-200 shadow-md
                px-4 py-4 flex flex-wrap items-center justify-between gap-4">

                {/* Campo de búsqueda */}
                <div className="flex items-center w-[300px] md:w-2/4 lg:w-5/8">
                    <input
                        type="text"
                        placeholder="Buscar vendedores..."
                        className="flex-1 h-10 px-3 text-sm outline-none font-[Inter] border border-neutral-300 border-r-0 rounded-l-md"
                    />
                    <button
                        className="h-10 w-10 bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01] text-white flex items-center justify-center rounded-r-md border border-neutral-400 border-l-0">
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
                        <select
                            className="appearance-none w-[180px] h-10 px-3 pr-8 border border-neutral-300 rounded-md font-[Inter] text-sm text-neutral-900 focus:outline-none"
                        >
                            <option>Nombre</option>
                            <option>Productos</option>
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
            {/* Grid vendedores */}
            <div className="w-full bg-neutral-50  px-8 md:px-32 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8">

                    {/* Vendedores */}
                    {items.map(item => (
                        <div
                            key={item["id"]}
                            className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col items-center overflow-hidden"
                        >
                            {/* Imagen */}
                            <img
                                src={item["avatar"] || "/farmer.png"}
                                alt={item["name"]}
                                className="w-30 h-30 rounded-full mt-4 object-cover"
                            />

                            {/* Contenido */}
                            <div className="mb-4 text-center">
                                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                                    {item["name"]}
                                </h3>

                                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2">
                                    {item["desc"]}
                                </p>

                                <Link
                                    to={`/products-by-seller/${item["id"]}`}
                                    className="bg-white hover:bg-neutral-100 border border-neutral-300 active:bg-neutral-200 px-4 py-2 rounded-xl transition"
                                >
                                    View products
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

    );
};
