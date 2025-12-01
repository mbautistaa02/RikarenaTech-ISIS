import React from "react";

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-gradient-to-r from-[#448502] to-[#83592E] text-white flex flex-col justify-center py-10">
            {/*Contenedor interno */}
            <div className="max-w-[1120px] w-full mx-auto px-6 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">

                {/* Texto izquierdo */}
                <p className="text-base md:text-lg font-normal text-center md:text-left">
                    Conecta con productores nacionales
                </p>

                {/* Columna derecha */}
                <div className="flex flex-col items-center md:items-end text-center md:text-right">
                    <p className="text-base md:text-lg font-semibold mb-3">
                        Únete a nuestra comunidad
                    </p>
                    <button className="flex items-center justify-center w-full max-w-[256px] h-10 bg-gray-100 text-gray-800 font-medium text-sm rounded-md gap-3 hover:bg-gray-300 active:bg-gray-400 transition-colors">
                        Contáctanos
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Línea divisoria */}
            <div className="w-full max-w-[1120px] mx-auto mt-8 border-t border-white/60" />
        </footer>
    );
};
