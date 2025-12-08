import { useEffect, useState } from "react";
import {Link, useNavigate, useParams} from "react-router-dom";

export const ProductsBySeller = () => {
    const { username } = useParams();
    const [seller, setSeller] = useState(null);
    useEffect(() => {
        fetch(`http://localhost:8000/api/users/sellers/${username}/`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data) {
                    setSeller(data.data); // el objeto del producto
                }
            })
    }, [username]);
    const [items, setItems] = useState([]);
    useEffect(() => {
        fetch(`http://localhost:8000/api/users/sellers/${username}/posts/ `, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            .then(r => r.json())
            .then(data => setItems(data));
    }, [username]);
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
                                alt={seller["username"]}
                                className="w-32 h-32 rounded-full mt-4 object-cover"
                            />

                            <div className="mb-4 text-center">
                                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                                    {seller["username"]}
                                </h3>

                                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2 ml-4 mr-4">
                                    {seller["email"]}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            {/* Productos de vendedor con USERNAME */}
            <div className="w-full bg-neutral-50 px-8 md:px-32 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

                    {(items as any)?.data?.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <div
                            key={item["id"]}
                            className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col overflow-hidden"
                        >
                            {/* Imagen */}
                            <img
                                src={(item.images && item.images.length > 0 ? item.images[0].image : "/blueberry.png")}
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
