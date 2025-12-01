import { useState } from "react";

export default function PanelDeModerador() {
  const [selectedCategory, setSelectedCategory] = useState("Public");

  return (
    <div className="w-full min-h-screen bg-gray-50 px-8 py-10 flex flex-col gap-10">

      {/* ---------- TÍTULO ---------- */}
      <h1 className="text-center font-[Outfit] text-[32px] font-bold text-neutral-900">
        Panel de moderador
      </h1>

      {/* ---------- CONTENEDOR PRINCIPAL ---------- */}
      <div className="bg-white shadow-sm rounded-xl p-10 max-w-7xl mx-auto w-full">

        {/* Grid 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ============================================================
              COLUMNA IZQUIERDA – FORMULARIO DE ALERTA
          ============================================================ */}
          <div className="flex flex-col gap-6">

            {/* ----- Campo: Título ----- */}
            <div className="flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Alert Title
              </label>
              <input
                type="text"
                placeholder="Premium Organic Blueberries"
                className="w-full h-[45px] px-3 font-[Inter] text-sm bg-neutral-200/10 
                border border-neutral-300 rounded-md focus:ring-2 
                focus:ring-neutral-300/30 focus:outline-none"
              />
            </div>

            {/* ----- Campo: Descripción ----- */}
            <div className="flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Alert Description
              </label>

              <textarea
                placeholder="Describe here what happened or the alert message..."
                className="w-full h-[120px] px-3 py-2 font-[Inter] text-sm text-neutral-900 
                bg-neutral-200/10 border border-neutral-300 rounded-md 
                focus:ring-2 focus:ring-neutral-300/30 focus:outline-none"
              />
            </div>

            {/* ----- Subida de imagen ----- */}
            <div className="flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Alert Image
              </label>

              <div className="mt-1 border-2 border-neutral-300 border-dashed bg-neutral-200/20 
              rounded-xl w-full h-[150px] flex flex-col items-center justify-center 
              text-neutral-600 cursor-pointer">
                <svg
                  className="w-10 h-10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 16l4-5h-3V4h-2v7H8z" />
                </svg>

                <p className="mt-2 font-[Inter] text-[14px]">
                  Drag & drop your images here, or click to browse
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================
              COLUMNA DERECHA – OPCIONES
          ============================================================ */}
          <div className="flex flex-col gap-8">

            {/* ----- Categoría ----- */}
            <div className="flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Category
              </label>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-[40px] px-3 font-[Inter] text-sm 
                bg-neutral-200/10 border border-neutral-300 rounded-md 
                focus:ring-2 focus:ring-neutral-300/30 focus:outline-none"
              >
                <option value="Public">Public</option>
                <option value="Option1">Option 1</option>
                <option value="Option2">Option 2</option>
              </select>
            </div>

            {/* ----- Botón enviar ----- */}
            <button
              className="w-full h-[45px] bg-[#448502] text-white rounded-md 
              font-[Inter] font-semibold hover:bg-[#3C7602] active:bg-[#2F5D01]"
            >
              Submit Post
            </button>

            {/* ----- Botón cancelar ----- */}
            <button
              className="w-full h-[45px] border border-neutral-300 rounded-md 
              font-[Inter] font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
