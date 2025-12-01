import React from "react";

export const Profile: React.FC = () => {
    return (
        <div className="w-full flex bg-gray-50 justify-center px-4">
            <div className="w-full mt-10 mb-10 max-w-3xl bg-white rounded-xl shadow-sm p-8">

                {/* Título principal */}
                <h1 className="text-[30px] font-[Outfit] font-bold text-neutral-900">
                    Editar perfil
                </h1>

                {/* Subtítulo */}
                <p className="text-[16px] text-neutral-600 mt-2 font-[Inter]">
                    Actualiza tu información personal
                </p>

                {/* Imagen de perfil */}
                <h2 className="text-[18px] font-semibold mt-10 font-[Outfit]">
                    Foto de perfil
                </h2>

                <div className="flex items-center gap-6 mt-4">
                    <div className="w-[120px] h-[120px] rounded-full">
                        <img
                            src="/farmer.jpg"
                            alt="Producto"
                            className="rounded-full"
                        />
                    </div>

                    <button className="border border-neutral-200 hover:bg-gray-50 rounded-md h-10 px-4 text-primary-500 font-medium">
                        Cambiar foto
                    </button>
                </div>

                {/* Información */}
                <h2 className="text-[18px] font-semibold mt-10 font-[Outfit]">
                    Información personal
                </h2>

                {/* Nombre */}
                <div className="mt-4">
                    <label className="font-medium text-[14px] text-neutral-900 font-[Inter]">
                        Nombre
                    </label>
                    <input
                        type="text"
                        className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md font-[Inter]"
                        placeholder="Ingresa tu nombre"
                    />
                </div>

                {/* Descripción */}
                <div className="mt-6">
                    <label className="font-medium text-[14px] text-neutral-900 font-[Inter]">
                        Descripción
                    </label>
                    <textarea
                        className="w-full h-[100px] mt-1 p-3 border border-neutral-300 rounded-md font-[Inter]"
                        placeholder="Escribe algo sobre ti..."
                    ></textarea>
                </div>
                {/* Ubicación */}
                <div className="mt-4">
                    <label className="font-medium text-[14px] text-neutral-900 font-[Inter]">
                        Ubicacion
                    </label>
                    <input
                        type="text"
                        className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md font-[Inter]"
                        placeholder="Ingresa tu departamento o municipio"
                    />
                </div>
                {/* Preferencias */}
                <h2 className="text-[18px] font-semibold mt-10 font-[Outfit]">
                    Notificaciones
                </h2>

                <div className="mt-4 flex flex-col gap-3">

                    {/* Checkbox 1 */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="peer appearance-none w-4 h-4 border border-neutral-400 rounded checked:bg-green-600 checked:border-green-600 transition"
                        />
                        <span className="">
                            Recibir alertas
                          </span>
                    </label>



                </div>


                {/* Botones */}
                <div className="flex justify-end gap-4 mt-12">
                    <button className="border border-neutral-200 hover:bg-gray-50 px-4 h-10 rounded-md text-neutral-900 font-[Inter]">
                        Cancelar
                    </button>

                    <button
                        className="w-[129px] h-[40px] px-3 flex items-center justify-center font-[Inter] text-[14px] font-medium leading-[22px]
                                    text-white bg-[#448502] rounded-md hover:bg-[#3C7602] active:bg-[#2F5D01] disabled:opacity-40 disabled:pointer-events-none">
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};