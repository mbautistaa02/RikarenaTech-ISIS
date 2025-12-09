import { useState, useEffect, useRef } from "react";

interface Municipality {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  municipalities: Municipality[];
  municipality_count: number;
}

interface AlertCategory {
  category_name: string;
  description: string;
}

export default function PanelDeModerador() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedScope, setSelectedScope] = useState("Global");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<AlertCategory[]>([]);
  const [alertImages, setAlertImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFiles = (files: FileList | null) => {
    if (!files) return;
    const filesArr = Array.from(files);
    
    const MAX_IMAGES = 10;
    const currentCount = alertImages.length;
    const newCount = currentCount + filesArr.length;
    
    // Validar que no exceda el límite
    if (newCount > MAX_IMAGES) {
      alert(`Solo puedes agregar ${MAX_IMAGES - currentCount} imagen(es) más. Máximo ${MAX_IMAGES} imágenes permitidas.`);
      return;
    }

    // Append to existing selection so multiple picks accumulate
    setAlertImages((prevFiles) => {
      const updated = [...prevFiles, ...filesArr];
      return updated;
    });

    // Generate previews for new files and append to existing previews
    setPreviewUrls((prevUrls) => {
      const newUrls = filesArr.map((file) => URL.createObjectURL(file));
      return [...prevUrls, ...newUrls];
    });
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const openFileDialog = () => fileInputRef.current?.click();

  const handleCancel = () => {
    setAlertTitle("");
    setAlertDescription("");
    setSelectedCategory("");
    setSelectedScope("Global");
    setSelectedDepartment("");
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setAlertImages([]);
    setPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setAlertImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const urlToRevoke = prev[index];
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!alertTitle.trim()) {
      alert("Por favor ingresa un título para la alerta");
      return;
    }
    if (!alertDescription.trim()) {
      alert("Por favor ingresa una descripción para la alerta");
      return;
    }
    if (!selectedCategory) {
      alert("Por favor selecciona una categoría");
      return;
    }
    if (selectedScope === "Departamental" && !selectedDepartment) {
      alert("Por favor selecciona un departamento");
      return;
    }
    
    // Validar número máximo de imágenes
    const MAX_IMAGES = 10;
    if (alertImages.length > MAX_IMAGES) {
      alert(`Demasiadas imágenes. El máximo permitido es ${MAX_IMAGES}.`);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("alert_title", alertTitle);
      formData.append("alert_message", alertDescription);
      formData.append("category_name", selectedCategory);
      
      // Mapear scope a los valores correctos del backend
      const scopeValue = selectedScope === "Global" ? "global" : "departamental";
      formData.append("scope", scopeValue);
      
      if (selectedScope === "Departamental" && selectedDepartment) {
        formData.append("department_name", selectedDepartment);
      }

      // Agregar imágenes
      alertImages.forEach((file) => {
        formData.append("images", file);
      });

      // Console log para ver los datos enviados
      console.log("=== JSON enviado al backend ===");
      const formDataObj: any = {};
      for (let pair of formData.entries()) {
        if (pair[0] === "images") {
          formDataObj[pair[0]] = formDataObj[pair[0]] || [];
          formDataObj[pair[0]].push((pair[1] as File).name);
        } else {
          formDataObj[pair[0]] = pair[1];
        }
      }
      console.log(JSON.stringify(formDataObj, null, 2));
      console.log("================================");

      const response = await fetch("http://localhost:8000/api/alerts/create/", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Alerta creada:", data);
        alert("Alerta creada exitosamente");
        handleCancel(); // Limpiar formulario
      } else {
        const errorData = await response.json();
        console.error("Error:", errorData);
        alert(`Error al crear la alerta: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Error al enviar la alerta:", error);
      alert("Error al crear la alerta. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments and categories from backend
  useEffect(() => {
    // Fetch departments
    fetch("http://localhost:8000/api/users/departments/", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          setDepartments(response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching departments:", error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch alert categories
    fetch("http://localhost:8000/api/alerts/categories/", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  }, []);

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
                Titulo de la Alerta
              </label>
              <input
                type="text"
                placeholder=""
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="w-full h-[45px] px-3 font-[Inter] text-sm bg-neutral-200/10 
                  border border-neutral-300 rounded-md focus:ring-2 
                  focus:ring-neutral-300/30 focus:outline-none"
              />
            </div>

            {/* ----- Campo: Descripción ----- */}
            <div className="flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Descripción
              </label>

              <textarea
                placeholder=""
                value={alertDescription}
                onChange={(e) => setAlertDescription(e.target.value)}
                className="w-full h-[120px] px-3 py-2 font-[Inter] text-sm text-neutral-900 
                  bg-neutral-200/10 border border-neutral-300 rounded-md 
                  focus:ring-2 focus:ring-neutral-300/30 focus:outline-none"
              />
            </div>

            {/* ----- Subida de imagen ----- */}
            <div className="flex flex-col gap-2">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Imágenes de la Alerta
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleSelectFiles(e.target.files)}
              />

              <button
                type="button"
                onClick={openFileDialog}
                className="mt-1 border-2 border-neutral-300 border-dashed bg-neutral-200/20 
                  rounded-xl w-full h-[150px] flex flex-col items-center justify-center 
                  text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                <svg
                  className="w-10 h-10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 16l4-5h-3V4h-2v7H8z" />
                </svg>

                <p className="mt-2 font-[Inter] text-[14px] text-center px-4">
                  Arrastra y suelta imágenes aquí o haz clic para buscarlas
                </p>
                {alertImages.length > 0 && (
                  <span className="mt-2 text-sm text-neutral-700 font-[Inter]">
                    {alertImages.length} archivo{alertImages.length !== 1 ? "s" : ""} seleccionado{alertImages.length !== 1 ? "s" : ""}
                  </span>
                )}
              </button>

              {previewUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {previewUrls.map((url, idx) => (
                    <div
                      key={url}
                      className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm"
                    >
                      <img
                        src={url}
                        alt={`preview-${idx}`}
                        className="w-full h-28 object-cover"
                      />
                      <div className="px-2 py-1 text-[12px] text-neutral-700 truncate font-[Inter]">
                        {alertImages[idx]?.name}
                      </div>
                      <div className="px-2 pb-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="text-[12px] text-red-600 font-[Inter] hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================
              COLUMNA DERECHA – OPCIONES
          ============================================================ */}
          <div className="flex flex-col gap-8">
            {/* ----- Categoría ----- */}
            <div className="flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Categorias de Alerta
              </label>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={loading}
                className="w-full h-[40px] px-3 font-[Inter] text-sm 
                  bg-neutral-200/10 border border-neutral-300 rounded-md 
                  focus:ring-2 focus:ring-neutral-300/30 focus:outline-none
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loading ? "Cargando categorías..." : "Seleccione una categoría"}
                </option>
                {Array.isArray(categories) && categories.map((cat) => (
                  <option key={cat.category_name} value={cat.category_name}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* ----- Scope ----- */}
            <div className="flex flex-col gap-1">
              <label className="font-[Inter] text-sm font-medium text-neutral-900">
                Alcance
              </label>

              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="w-full h-[40px] px-3 font-[Inter] text-sm 
                  bg-neutral-200/10 border border-neutral-300 rounded-md 
                  focus:ring-2 focus:ring-neutral-300/30 focus:outline-none"
              >
                <option value="Global">Global</option>
                <option value="Departamental">Departamental</option>
              </select>
            </div>

            {/* ----- Departamento (solo si scope es Departamental) ----- */}
            {selectedScope === "Departamental" && (
              <div className="flex flex-col gap-1">
                <label className="font-[Inter] text-sm font-medium text-neutral-900">
                  Departamento
                </label>

                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  disabled={loading}
                  className="w-full h-[40px] px-3 font-[Inter] text-sm 
                    bg-neutral-200/10 border border-neutral-300 rounded-md 
                    focus:ring-2 focus:ring-neutral-300/30 focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loading ? "Cargando departamentos..." : "Seleccione un departamento"}
                  </option>
                  {Array.isArray(departments) && departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ----- Botón enviar ----- */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-[45px] bg-[#448502] text-white rounded-md 
                font-[Inter] font-semibold hover:bg-[#3C7602] active:bg-[#2F5D01]
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando..." : "Crear alerta"}
            </button>

            {/* ----- Botón cancelar ----- */}
            <button
              className="w-full h-[45px] border border-neutral-300 rounded-md 
                font-[Inter] font-semibold text-neutral-700 hover:bg-neutral-100"
              type="button"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
