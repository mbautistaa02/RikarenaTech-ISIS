import { useEffect, useState } from "react";
import {Link, useParams} from "react-router-dom";
import { useNavigate } from "react-router-dom";
export const ProductsBySeller = () => {
    const [items, setItems] = useState([]);
    const { id } = useParams();
    useEffect(() => {
        fetch("https://6917819021a96359486d20a1.mockapi.io/api/v1/products")
            .then(r => r.json())
            .then(data => {
                const filtered = data.filter((p: { sellerId: string | undefined; }) => p.sellerId === id);
                setItems(filtered);
            });
    }, [id]);

    const [seller, setSeller] = useState(null);
    useEffect(() => {
        // 2. Datos del vendedor
        fetch(`https://6917819021a96359486d20a1.mockapi.io/api/v1/sellers/${id}`)
            .then(r => r.json())
            .then(data => setSeller(data));

    }, [id]);
    const navigate = useNavigate();
    return (

        <section className="w-full bg-neutral-50 flex flex-col items-center">
            <div className="w-full py-3 px-20">
                <button onClick={() => navigate("/sellers")}
                        className="hidden sm:flex items-center justify-center px-4 py-2 h-9 rounded-md bg-[#448502] text-white text-sm font-medium hover:bg-[#3C7602] active:bg-[#2F5D01] font-[Inter] transition">
                    <span className="text-2xl">←</span>
                </button>
            </div>


            {/* Mi perfil desc */}
            <div className="w-full bg-neutral-50  px-8 md:px-32 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8">
                    {seller && (
                        <div className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col items-center overflow-hidden">
                            <img
                                src={seller["avatar"] || "/default-avatar.png"}
                                alt={seller["name"]}
                                className="w-32 h-32 rounded-full mt-4 object-cover"
                            />

                            <div className="mb-4 text-center">
                                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                                    {seller["name"]}
                                </h3>

                                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2 ml-4 mr-4">
                                    {seller["desc"]}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
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
