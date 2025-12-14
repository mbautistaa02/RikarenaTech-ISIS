import React from "react";
import { useNavigate } from "react-router-dom";

export const Contact: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sección Hero */}
      <div className="w-full bg-gradient-to-r from-[#448502] to-[#83592E] text-white py-12">
        <div className="max-w-[1120px] mx-auto px-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm mb-4 hover:opacity-80 transition"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Atrás
          </button>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Conócenos</h1>
          <p className="text-lg opacity-90">¡Estos somos nosotros!</p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow py-12">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Información de contacto */}
            <div className="flex flex-col justify-start">
              <h2 className="text-2xl font-semibold text-[#171A1F] mb-6">
                ¿Necesitas más información?
              </h2>

              <div className="space-y-6">
                {/* Andres */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#448502] bg-opacity-10"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#171A1F]">
                      Andres
                    </h3>
                    <p className="text-gray-600 mt-1">Desarrollador</p>
                  </div>
                </div>

                {/* Yamid */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#448502] bg-opacity-10"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#171A1F]">
                      Yamid
                    </h3>
                    <p className="text-gray-600 mt-1">Frontend</p>
                  </div>
                </div>

                {/* Luisa */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#448502] bg-opacity-10"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#171A1F]">
                      Luisa
                    </h3>
                    <p className="text-gray-600 mt-1">Frontend</p>
                  </div>
                </div>
                {/* Ivan */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#448502] bg-opacity-10"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#171A1F]">
                      Ivan
                    </h3>
                    <p className="text-gray-600 mt-1">Desarrollador</p>
                  </div>
                </div>
                {/* Manuel */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#448502] bg-opacity-10"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#171A1F]">
                      Manuel
                    </h3>
                    <p className="text-gray-600 mt-1">Desarrollador</p>
                  </div>
                </div>
                {/* Luisa */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#448502] bg-opacity-10"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#171A1F]">
                      Eduard
                    </h3>
                    <p className="text-gray-600 mt-1">Desarrollador</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
