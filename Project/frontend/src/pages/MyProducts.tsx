import { useEffect, useState } from "react";
import {Link} from "react-router-dom";

export const MyProducts = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetch("https://6917819021a96359486d20a1.mockapi.io/api/v1/products")
            .then(r => r.json())
            .then(data => setItems(data));
    }, []);

    const [crops, setCrops] = useState([]);

    useEffect(() => {
        //Cambiar a crops en la conexión con backend
        fetch("https://6917819021a96359486d20a1.mockapi.io/api/v1/products")
            .then(r => r.json())
            .then(data => setCrops(data));
    }, []);

    return (
        <section className="w-full bg-neutral-50 flex flex-col items-center">

            {/* DESC PROFILE*/}
            <section className="w-full bg-neutral-50 flex flex-col items-center">
                <div className="w-full bg-neutral-50  px-8 md:px-32 py-10">
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8">

                        {/* Vendedor */}

                        <div
                            className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col items-center overflow-hidden"
                        >
                            {/* Imagen */}
                            <img
                                src="/farmer.jpg"
                                alt="Producto"
                                className="w-30 h-30 rounded-full mt-4 object-cover"
                            />
                            {/* Contenido */}
                            <div className="mb-4 text-center">
                                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                                    Farmer
                                </h3>
                                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2 ml-4 mr-4">
                                    Farmer John has been passionately cultivating fresh, organic produce for over 20 years. Nestled in the fertile valleys of Willow Creek, our farm is dedicated to sustainable practices, ensuring every fruit and vegetable is grown with care and respect for nature. We believe in healthy soil, healthy plants, and healthy communities. Explore our selection of nature's finest, hand-picked daily for your table.
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

                    {items.map(item => (
                        <div
                            key={item["id"]}
                            className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col overflow-hidden"
                        >
                            {/* Imagen */}
                            <img
                                src={item["image"] || "/blueberry.png"}
                                alt={item["name"]}
                                className="w-full h-48 object-cover"
                            />

                            {/* Contenido */}
                            <div className="p-4">
                                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                                    {item["name"]}
                                </h3>

                                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2">
                                    {item["desc"]}
                                </p>

                                <div className="flex items-center justify-between mt-4">
                                <span className="text-xl font-bold text-green-600">
                                  ${item["price"]}
                                </span>
                                    <div>
                                        <button
                                            className="bg-[#B2373F] hover:bg-[#992F36] active:bg-[#7F262C] text-white border border-neutral-300 px-4 py-2 rounded-xl transition">
                                            Eliminar
                                        </button>
                                        <Link
                                            to={`/edit_post/${item["id"]}`}
                                            className="bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01] text-white border border-neutral-300 px-4 py-2 rounded-xl transition">
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

                    {crops.map(crop => (
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
                                       text-white border border-neutral-300 px-4 py-2 rounded-xl transition">
                                        Eliminar
                                    </button>

                                    <Link
                                        to={`/edit_post/${crop["id"]}`}
                                        className="bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01]
                                       text-white border border-neutral-300 px-4 py-2 rounded-xl transition">
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
