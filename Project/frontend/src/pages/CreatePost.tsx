import {useState} from "react";
export default function CreatePost() {
    const [showImage, setShowImage] = useState<boolean>(false);
    return (
        <div className="w-full min-h-screen bg-gray-50 px-8  flex flex-col gap-10">
            <div className="w-full min-h-screen bg-gray-50  py-10 flex flex-col gap-10">

                {/* Título */}
                <h1 className="font-[Outfit] text-[30px] font-bold text-neutral-900">
                    Crear nuevo post de venta
                </h1>

                {/* Contenedor principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">


                    {/* ----------- COLUMNA IZQUIERDA ----------- */}
                    <div className="bg-white shadow-sm rounded-xl p-6">

                        <h2 className="font-[Outfit] text-[20px] font-semibold text-neutral-900">
                            Imagen principal
                        </h2>

                        <p className="font-[Inter] text-[14px] text-neutral-600 mt-2">
                            Sube la imagen para tu publicación.
                        </p>

                        {/* Botón mostrar/ocultar */}
                        <button
                            type="button"
                            onClick={() => setShowImage((prev) => !prev)}
                            className="mt-4 mb-4 bg-[#448502] text-white px-4 py-2 rounded-md font-[Inter] text-sm"
                        >
                            {showImage ? "Ocultar imagen" : "Mostrar imagen"}
                        </button>

                        {/* Área de subida */}
                        <div className="mt-2 border-2 border-neutral-300 border-dashed bg-neutral-200/20 rounded-xl w-full h-[580px] flex flex-col items-center justify-center">

                            {showImage ? (
                                <img
                                    src="/blueberry.png"     // Cambia esto por tu imagen
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            ) : (
                                <>
                                    <svg
                                        className="w-12 h-12 text-neutral-600"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 16l4-5h-3V4h-2v7H8z" />
                                    </svg>

                                    <p className="mt-4 font-[Inter] text-[16px] text-neutral-600 text-center">
                                        Arrastra aquí una imagen o haz clic para subir un archivo
                                    </p>
                                </>
                            )}
                        </div>

                    </div>


                    {/* ----------- COLUMNA DERECHA ----------- */}
                    <div className="bg-white shadow-sm border border-green-700 rounded-xl p-6">

                        <h2 className="font-[Outfit] text-[20px] font-semibold text-neutral-900">
                            Información del post
                        </h2>

                        <p className="font-[Inter] text-[14px] text-neutral-600 mt-2">
                            Completa los detalles de tu publicación.
                        </p>

                        {/* ----- Campo: Título ----- */}
                        <div className="mt-6 flex flex-col gap-1">
                            <label className="font-[Inter] text-sm font-medium text-neutral-900">
                                Título
                            </label>
                            <input
                                type="text"
                                className="
                w-full h-[49px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
                            />
                        </div>

                        {/* ----- Campo: Descripción ----- */}
                        <div className="mt-6 flex flex-col gap-1">
                            <label className="font-[Inter] text-sm font-medium text-neutral-900">
                                Descripción
                            </label>

                            <textarea
                                className="
                w-full h-[120px] px-3 py-2
                font-[Inter] text-sm text-neutral-900
                bg-neutral-200/10 border border-neutral-300 rounded-md
                hover:border-neutral-300
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
                            />
                        </div>

                        {/* ----- Campo: Precio ----- */}
                        <div className="mt-6 flex flex-col gap-1 relative">
                            <label className="font-[Inter] text-sm font-medium text-neutral-900">
                                Precio
                            </label>

                            <input
                                type="number"
                                className="
                w-full h-[49px] px-9
                bg-neutral-200/10 border border-neutral-300 rounded-md
                font-[Inter] text-sm
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
                            />

                            {/* icono izquierda */}
                            <span className="absolute left-3 top-[46px] font-bold text-neutral-600">
              $
            </span>
                        </div>

                        {/* ----- Label categoría ----- */}
                        <p className="mt-8 font-[Inter] text-sm font-medium text-neutral-900">
                            Categoría
                        </p>

                        {/* ----- Dropdown categoria ----- */}
                        <div className="mt-3 relative">
                            <select
                                className="
                w-full h-[40px] px-3
                font-[Inter] text-sm
                bg-neutral-200/10 border border-neutral-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-neutral-300/30
              "
                            >
                                <option>Seleccionar categoría</option>
                                <option>Frutas</option>
                                <option>Verduras</option>
                                <option>Lácteos</option>
                            </select>
                        </div>

                        {/* ----- Botón crear post ----- */}
                        <button
                            className="
              w-full h-[40px] mt-8
              bg-[#448502] text-white rounded-md
              font-[Inter] font-bold text-sm
              hover:bg-[#3C7602]
              active:bg-[#2F5D01]
              disabled:opacity-40 disabled:pointer-events-none
            "
                        >
                            Crear publicación
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
