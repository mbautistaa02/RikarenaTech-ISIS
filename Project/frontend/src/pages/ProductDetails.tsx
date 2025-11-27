import {Link, useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";

export default function ProductDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [sellerId, setSellerId] = useState(null);
    const [seller, setSeller] = useState(null);
    useEffect(() => {
        fetch(`https://6917819021a96359486d20a1.mockapi.io/api/v1/products/${id}`)
            .then(r => r.json())
            .then(data =>
            {setItem(data);
            setSellerId(data.sellerId);})

    }, [id]);
    useEffect(() => {
        if (!sellerId) return; // evitar fetch antes de tiempo

        fetch(`https://6917819021a96359486d20a1.mockapi.io/api/v1/sellers/${sellerId}`)
            .then(r => r.json())
            .then(data => setSeller(data));

    }, [sellerId]);
    if (!item || !seller) {
        return <div className="p-10 text-center">Cargando...</div>;
    } else {
        return (
            <div>
                <div className="w-full py-3 px-20 bg-neutral-50">
                    <button onClick={() => navigate("/products")}
                            className="hidden sm:flex items-center justify-center px-4 py-2 h-9 rounded-md bg-[#448502] text-white text-sm font-medium hover:bg-[#3C7602] active:bg-[#2F5D01] font-[Inter] transition">
                        <span className="text-2xl">←</span>
                    </button>
                </div>

                {/* PRODUCTO */}
                {(item && seller &&
                    <div
                        className="w-full bg-neutral-50 flex flex-col lg:flex-row lg:gap-16 px-4 lg:px-20 py-2 overflow-visible">

                        {/* Imagen */}
                        <div className="flex items-center">
                            <img
                                src={item["image"] || "/blueberry.png"}
                                alt={item["name"]}
                                className="w-full max-w-[600px] max-h-[400px] h-auto rounded-2xl object-cover mx-auto lg:mx-0"/>

                        </div>
                        {/* Description panel */}
                        <div className="mt-10 lg:mt-0 flex lg:max-w-1/2 flex-col">

                            {/* Título */}
                            <h1 className="font-[Outfit] text-[28px] leading-[34px] font-bold text-neutral-900
                   lg:text-[36px] lg:leading-[40px]">
                                {item["name"]}
                            </h1>

                            {/* Precio */}
                            <h2 className="font-[Outfit] text-[24px] leading-[30px] font-semibold text-[#448502]
                   mt-3
                   lg:text-[30px] lg:leading-[36px]">
                                {item["price"]}
                            </h2>

                            {/* Descripción */}
                            <p className="font-[Inter] text-[16px] leading-[25px] text-neutral-600 mt-6 max-w-[90%] mx-auto lg:mx-0
                  lg:text-[18px] lg:leading-[29px] lg:w-[592px]">
                                {item["desc"]}
                            </p>
                            {/* Vendedor info corta*/}
                            <div className="flex">
                                <p className="font-[Inter] text-[14px] leading-[22px] font-medium text-neutral-900 mt-6
                  lg:text-[16px] lg:leading-[24px]">
                                    Este producto es vendido por:
                                </p>
                                <p className="font-[Inter] text-[14px] leading-[22px] font-medium text-[#448502] mt-6
                  lg:text-[16px] lg:leading-[24px] px-2">
                                    {seller["name"]}
                                    {seller["id"]}
                                </p>
                            </div>
                            {/* Botón contactar con vendedor */}
                            <button
                                className=" mt-6 w-full max-w-[592px] h-[48px] px-3 border border-[#448502] rounded-md justify-center
        font-[Inter] text-[16px] lg:text-[18px] font-semibold text-[#448502] bg-neutral-50 hover:bg-neutral-100 active:bg-white">
                                Contactar al vendedor
                            </button>

                        </div>

                    </div>
                )}
                {/* VENDEDOR */}
                <section className="w-full bg-neutral-50 flex flex-col items-center">
                    <div className="w-full bg-neutral-50  px-8 md:px-32 py-10">
                        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8">

                            {/* Vendedores */}

                            <div
                                className="relative bg-[#EEFFDEFF] rounded-xl shadow-sm border border-transparent flex flex-col items-center overflow-hidden"
                            >
                                {/* Imagen */}
                                <img
                                    src={seller["avatar"] || "/blueberry.png"}
                                    alt={seller["name"]}
                                    className="w-30 h-30 rounded-full mt-4 object-cover"
                                />
                                {/* Contenido */}
                                <div className="mb-4 text-center">
                                    <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                                        {seller["name"]}
                                    </h3>
                                    <p className="font-[Inter] text-[14px] text-neutral-600 mb-2 ml-4 mr-4">
                                        {seller["desc"]}
                                    </p>
                                    <Link
                                        to={`/products-by-seller/${seller["id"]}`}
                                        className="bg-[#83592EFF] hover:bg-[#6C4926FF] text-white border border-neutral-300 active:bg-[#53381DFF] px-4 py-2 rounded-xl transition"
                                    >
                                        View products
                                    </Link>
                                 </div>


                            </div>

                        </div>
                    </div>
                </section>
            </div>

        );
    }
}
