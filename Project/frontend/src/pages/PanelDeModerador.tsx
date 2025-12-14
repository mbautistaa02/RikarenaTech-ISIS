import { useCallback, useEffect, useRef, useState } from "react";

import { formatErrorMessage, showToast } from "@/lib/toast";
import {
  getPostsForModeration,
  reactivatePost,
  updateModerationPost,
} from "@/services/postsService";
import type { PostItem } from "@/types/post";

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

interface AlertImage {
  image: string;
  uploaded_at: string;
}

interface Alert {
  id: number;
  alert_title: string;
  alert_message: string;
  category: AlertCategory;
  scope: string;
  department_name: string | null;
  images: AlertImage[];
  created_at: string;
  updated_at: string;
  created_by_username: string;
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
  const [showAlertsSection, setShowAlertsSection] = useState(true);
  const [showModerationSection, setShowModerationSection] = useState(true);
  const [moderationPosts, setModerationPosts] = useState<PostItem[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [processingPostId, setProcessingPostId] = useState<number | null>(null);
  const [moderationPage, setModerationPage] = useState(1);
  const [moderationHasNext, setModerationHasNext] = useState(false);
  const [moderationHasPrev, setModerationHasPrev] = useState(false);
  const [statusSelection, setStatusSelection] = useState<
    Record<number, string>
  >({});
  const [titleHasSpecialChars, setTitleHasSpecialChars] = useState(false);
  const [descriptionHasSpecialChars, setDescriptionHasSpecialChars] =
    useState(false);
  const [showMyAlertsSection, setShowMyAlertsSection] = useState(false);
  const [myAlerts, setMyAlerts] = useState<Alert[]>([]);
  const [myAlertsLoading, setMyAlertsLoading] = useState(false);
  const [myAlertsError, setMyAlertsError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFiles = (files: FileList | null) => {
    if (!files) return;
    const filesArr = Array.from(files);

    const MAX_IMAGES = 3;
    const currentCount = alertImages.length;
    const newCount = currentCount + filesArr.length;

    // Validar que no exceda el límite
    if (newCount > MAX_IMAGES) {
      showToast(
        "error",
        `Solo puedes agregar ${MAX_IMAGES - currentCount} imagen(es) más. Máximo ${MAX_IMAGES} imágenes permitidas.`,
      );
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

  const extractPageFromUrl = (url?: string | null) => {
    if (!url) return null;
    const parsed = new URL(url);
    const pageParam = parsed.searchParams.get("page");
    return pageParam ? Number(pageParam) : null;
  };

  const fetchModerationPosts = useCallback(
    async (page = 1, controller?: AbortController) => {
      setModerationLoading(true);
      setModerationError(null);
      try {
        const data = await getPostsForModeration(page, controller?.signal);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
            ? data.results
            : [];
        setModerationPosts(list);
        const initialSelection = list.reduce<Record<number, string>>(
          (acc, post) => {
            acc[post.id] = post.status ?? "";
            return acc;
          },
          {},
        );
        setStatusSelection(initialSelection);

        const nextPage = Array.isArray(data)
          ? null
          : extractPageFromUrl(data.next);
        const prevPage = Array.isArray(data)
          ? null
          : extractPageFromUrl(data.previous);
        setModerationHasNext(Boolean(nextPage));
        setModerationHasPrev(Boolean(prevPage));
        setModerationPage(page);
      } catch (error) {
        if (controller?.signal.aborted) return;
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las publicaciones para moderar.";
        setModerationError(formatErrorMessage(message));
      } finally {
        if (!controller?.signal.aborted) {
          setModerationLoading(false);
        }
      }
    },
    [],
  );

  const fetchMyAlerts = useCallback(async () => {
    setMyAlertsLoading(true);
    setMyAlertsError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/alerts/my_alerts/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        setMyAlerts(result.data || []);
      } else {
        const errorData = await response.json();
        setMyAlertsError(errorData.message || "Error al cargar tus alertas");
      }
    } catch (error) {
      console.error("Error fetching my alerts:", error);
      setMyAlertsError("Error al cargar tus alertas");
    } finally {
      setMyAlertsLoading(false);
    }
  }, []);

  // Load my alerts when section is shown
  useEffect(() => {
    if (showMyAlertsSection && myAlerts.length === 0) {
      fetchMyAlerts();
    }
  }, [showMyAlertsSection, myAlerts.length, fetchMyAlerts]);

  const validateAlertTitle = (value: string): boolean => {
    // Solo letras, números, espacios, puntos, comas y guiones
    const validPattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,-]+$/;
    return validPattern.test(value);
  };

  const validateAlertDescription = (value: string): boolean => {
    // Solo letras, números, espacios, puntos, comas, guiones y saltos de línea
    const validPattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,\n-]+$/;
    return validPattern.test(value);
  };

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!alertTitle.trim()) {
      showToast("error", "Por favor ingresa un título para la alerta");
      return;
    }
    if (alertTitle.length > 50) {
      showToast("error", "El título no puede exceder los 50 caracteres.");
      return;
    }
    if (!validateAlertTitle(alertTitle)) {
      showToast(
        "error",
        "El título no puede contener caracteres especiales. Solo letras, números, espacios, puntos, comas y guiones.",
      );
      return;
    }
    if (!alertDescription.trim()) {
      showToast("error", "Por favor ingresa una descripción para la alerta");
      return;
    }
    if (alertDescription.length > 800) {
      showToast("error", "La descripción no puede exceder los 800 caracteres.");
      return;
    }
    if (!validateAlertDescription(alertDescription)) {
      showToast(
        "error",
        "La descripción no puede contener caracteres especiales. Solo letras, números, espacios, puntos, comas y guiones.",
      );
      return;
    }
    if (!selectedCategory) {
      showToast("error", "Por favor selecciona una categoría");
      return;
    }
    if (selectedScope === "Departamental" && !selectedDepartment) {
      showToast("error", "Por favor selecciona un departamento");
      return;
    }

    // Validar número máximo de imágenes
    const MAX_IMAGES = 3;
    if (alertImages.length > MAX_IMAGES) {
      showToast(
        "error",
        `Demasiadas imágenes. El máximo permitido es ${MAX_IMAGES}.`,
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("alert_title", alertTitle);
      formData.append("alert_message", alertDescription);
      formData.append("category_name", selectedCategory);

      // Mapear scope a los valores correctos del backend
      const scopeValue =
        selectedScope === "Global" ? "global" : "departamental";
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

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/alerts/create/`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Alerta creada:", data);
        showToast("success", "Alerta creada exitosamente");
        handleCancel(); // Limpiar formulario
      } else {
        const errorData = await response.json();
        console.error("Error:", errorData);
        const fallback =
          "Error al crear la alerta. Por favor intenta de nuevo.";
        const detailMessage =
          (typeof errorData === "object" && errorData !== null
            ? "detail" in errorData
              ? (errorData as { detail?: string }).detail
              : "message" in errorData
                ? (errorData as { message?: string }).message
                : null
            : null) || fallback;
        showToast("error", formatErrorMessage(detailMessage));
      }
    } catch (error) {
      console.error("Error al enviar la alerta:", error);
      showToast(
        "error",
        "Error al crear la alerta. Por favor intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPost = async (postId: number) => {
    const reviewNotes =
      window.prompt("Razón del rechazo (opcional):")?.trim() || undefined;
    setProcessingPostId(postId);
    try {
      await updateModerationPost(postId, {
        status: "rejected",
        review_notes: reviewNotes,
      });
      showToast("success", "Publicación rechazada");
      fetchModerationPosts(moderationPage);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo rechazar la publicación.";
      showToast("error", formatErrorMessage(message));
    } finally {
      setProcessingPostId(null);
    }
  };

  const handleReactivatePost = async (postId: number) => {
    setProcessingPostId(postId);
    try {
      await reactivatePost(postId);
      showToast("success", "Publicación reactivada por 7 días");
      fetchModerationPosts(moderationPage);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo reactivar la publicación.";
      showToast("error", formatErrorMessage(message));
    } finally {
      setProcessingPostId(null);
    }
  };

  const handleApplyStatus = async (post: PostItem) => {
    const targetStatus = statusSelection[post.id];
    if (!targetStatus) {
      showToast("error", "Selecciona un estado para aplicar.");
      return;
    }

    if (targetStatus === post.status) {
      showToast("error", "El post ya tiene este estado.");
      return;
    }

    if (targetStatus === "reactivate") {
      await handleReactivatePost(post.id);
      return;
    }

    if (targetStatus === "rejected") {
      await handleRejectPost(post.id);
      return;
    }

    setProcessingPostId(post.id);
    try {
      await updateModerationPost(post.id, { status: targetStatus as any });
      showToast("success", "Estado actualizado");
      fetchModerationPosts(moderationPage);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado.";
      showToast("error", formatErrorMessage(message));
    } finally {
      setProcessingPostId(null);
    }
  };

  // Fetch departments and categories from backend
  useEffect(() => {
    // Fetch departments
    fetch(`${import.meta.env.VITE_API_BASE_URL}/users/departments/`, {
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
    fetch(`${import.meta.env.VITE_API_BASE_URL}/alerts/categories/`, {
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

  useEffect(() => {
    const controller = new AbortController();
    fetchModerationPosts(moderationPage, controller);
    return () => controller.abort();
  }, [fetchModerationPosts, moderationPage]);

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const statusClasses: Record<string, string> = {
    pending_review: "bg-amber-100 text-amber-800",
    rejected: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-neutral-200 text-neutral-800",
    sold: "bg-neutral-200 text-neutral-800",
    expired: "bg-neutral-200 text-neutral-800",
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    const normalized = status.toLowerCase();
    const classes =
      statusClasses[normalized] ||
      "bg-neutral-200 text-neutral-800 border border-neutral-300";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${classes}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 px-8 py-10 flex flex-col gap-10">
      {/* ---------- TÍTULO ---------- */}
      <h1 className="text-center font-[Outfit] text-[32px] font-bold text-neutral-900">
        Panel de moderador
      </h1>

      {/* ---------- Sección de alertas ---------- */}
      <section className="bg-white shadow-sm rounded-xl p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-[Outfit] text-[22px] font-semibold text-neutral-900">
            Gestión de alertas
          </h2>
          <button
            type="button"
            onClick={() => setShowAlertsSection((prev) => !prev)}
            className="text-sm font-[Inter] text-[#448502] hover:text-[#3C7602]"
          >
            {showAlertsSection ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {showAlertsSection && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* ============================================================
                COLUMNA IZQUIERDA – FORMULARIO DE ALERTA
            ============================================================ */}
            <div className="flex flex-col gap-6">
              {/* ----- Campo: Título ----- */}
              <div className="flex flex-col gap-1">
                <label className="font-[Inter] text-sm font-medium text-neutral-900">
                  Titulo de la Alerta
                  <span className="text-neutral-500 ml-2">
                    ({alertTitle.length}/50 caracteres)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder=""
                  maxLength={50}
                  value={alertTitle}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAlertTitle(value);
                    setTitleHasSpecialChars(
                      !validateAlertTitle(value) && value.length > 0,
                    );
                  }}
                  className="w-full h-[45px] px-3 font-[Inter] text-sm bg-neutral-200/10 
                    border border-neutral-300 rounded-md focus:ring-2 
                    focus:ring-neutral-300/30 focus:outline-none"
                />
                {titleHasSpecialChars && (
                  <p className="text-red-600 text-xs mt-1">
                    ⚠️ El título contiene caracteres especiales no permitidos.
                    Solo se permiten letras, números, espacios, puntos, comas y
                    guiones.
                  </p>
                )}
              </div>

              {/* ----- Campo: Descripción ----- */}
              <div className="flex flex-col gap-1">
                <label className="font-[Inter] text-sm font-medium text-neutral-900">
                  Descripción
                  <span className="text-neutral-500 ml-2">
                    ({alertDescription.length}/800 caracteres)
                  </span>
                </label>

                <textarea
                  placeholder=""
                  value={alertDescription}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAlertDescription(value);
                    setDescriptionHasSpecialChars(
                      !validateAlertDescription(value) && value.length > 0,
                    );
                  }}
                  maxLength={800}
                  className="w-full h-[120px] px-3 py-2 font-[Inter] text-sm text-neutral-900 
                    bg-neutral-200/10 border border-neutral-300 rounded-md 
                    focus:ring-2 focus:ring-neutral-300/30 focus:outline-none"
                />
                {descriptionHasSpecialChars && (
                  <p className="text-red-600 text-xs mt-1">
                    ⚠️ La descripción contiene caracteres especiales no
                    permitidos. Solo se permiten letras, números, espacios,
                    puntos, comas y guiones.
                  </p>
                )}
              </div>

              {/* ----- Subida de imagen ----- */}
              <div className="flex flex-col gap-2">
                <label className="font-[Inter] text-sm font-medium text-neutral-900">
                  Imágenes de la Alerta
                  <span className="text-neutral-500 ml-2">
                    ( Maximo 3 imágenes)
                  </span>
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
                      {alertImages.length} archivo
                      {alertImages.length !== 1 ? "s" : ""} seleccionado
                      {alertImages.length !== 1 ? "s" : ""}
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
                    {loading
                      ? "Cargando categorías..."
                      : "Seleccione una categoría"}
                  </option>
                  {Array.isArray(categories) &&
                    categories.map((cat) => (
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
                      {loading
                        ? "Cargando departamentos..."
                        : "Seleccione un departamento"}
                    </option>
                    {Array.isArray(departments) &&
                      departments.map((dept) => (
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
                disabled={
                  loading || titleHasSpecialChars || descriptionHasSpecialChars
                }
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
        )}
      </section>

      {/* ---------- Sección: Mis alertas creadas ---------- */}
      <section className="bg-white shadow-sm rounded-xl p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-[Outfit] text-[22px] font-semibold text-neutral-900">
            Mis alertas creadas
          </h2>
          <button
            type="button"
            onClick={() => setShowMyAlertsSection((prev) => !prev)}
            className="text-sm font-[Inter] text-[#448502] hover:text-[#3C7602]"
          >
            {showMyAlertsSection ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {showMyAlertsSection && (
          <div className="mt-6">
            {myAlertsLoading && (
              <div className="text-center text-neutral-600 py-8">
                Cargando tus alertas...
              </div>
            )}

            {myAlertsError && (
              <div className="text-center text-red-600 py-8">
                {myAlertsError}
              </div>
            )}

            {!myAlertsLoading && !myAlertsError && myAlerts.length === 0 && (
              <div className="text-center text-neutral-600 py-8">
                No has creado ninguna alerta aún.
              </div>
            )}

            {!myAlertsLoading && !myAlertsError && myAlerts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 border border-neutral-200"
                  >
                    {/* Categoría y Scope */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {alert.category.category_name}
                      </span>
                      <span
                        className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                          alert.scope === "global"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {alert.scope === "global" ? "Global" : "Departamental"}
                      </span>
                    </div>

                    {/* Título */}
                    <h3 className="text-[18px] font-bold font-[Outfit] text-neutral-900 mb-2">
                      {alert.alert_title}
                    </h3>

                    {/* Descripción */}
                    <p className="text-neutral-700 font-[Inter] text-sm leading-relaxed mb-4 line-clamp-3">
                      {alert.alert_message}
                    </p>

                    {/* Departamento (si aplica) */}
                    {alert.department_name && (
                      <p className="text-xs text-neutral-500 mb-3">
                        📍 Departamento: {alert.department_name}
                      </p>
                    )}

                    {/* Imágenes */}
                    {alert.images && alert.images.length > 0 && (
                      <div
                        className={`mt-4 ${
                          alert.images.length === 1
                            ? ""
                            : "grid grid-cols-2 gap-2"
                        }`}
                      >
                        {alert.images.map((img, index) => (
                          <img
                            key={index}
                            src={img.image}
                            alt={`alert-image-${index + 1}`}
                            className={`w-full ${
                              alert.images.length === 1 ? "h-40" : "h-32"
                            } object-cover rounded-md`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Fecha de creación */}
                    <p className="text-xs text-neutral-400 mt-4">
                      Creada: {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ---------- Sección moderación de posts ---------- */}
      <section className="bg-white shadow-sm rounded-xl p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[Outfit] text-[22px] font-semibold text-neutral-900">
              Moderación de publicaciones
            </h2>
            <p className="text-sm text-neutral-600 font-[Inter]">
              Revisa y aprueba/rechaza las publicaciones pendientes.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowModerationSection((prev) => !prev)}
              className="text-sm font-[Inter] text-[#448502] hover:text-[#3C7602]"
            >
              {showModerationSection ? "Ocultar" : "Mostrar"}
            </button>
            <button
              type="button"
              onClick={() => fetchModerationPosts()}
              disabled={moderationLoading}
              className="text-sm font-[Inter] text-white bg-[#448502] px-3 py-2 rounded-md hover:bg-[#3C7602] disabled:opacity-60"
            >
              {moderationLoading ? "Actualizando..." : "Recargar"}
            </button>
          </div>
        </div>

        {showModerationSection && (
          <div className="mt-6">
            {moderationLoading && (
              <div className="text-sm text-neutral-600 font-[Inter]">
                Cargando publicaciones...
              </div>
            )}

            {moderationError && (
              <div className="text-sm text-red-600 font-[Inter]">
                {moderationError}
              </div>
            )}

            {!moderationLoading &&
              !moderationError &&
              moderationPosts.length === 0 && (
                <div className="text-sm text-neutral-600 font-[Inter]">
                  No hay publicaciones para mostrar.
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {moderationPosts.map((post) => {
                const isProcessing = processingPostId === post.id;
                return (
                  <div
                    key={post.id}
                    className="border border-neutral-200 rounded-lg p-4 shadow-sm bg-neutral-50 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-[Outfit] text-lg font-semibold text-neutral-900">
                        {post.title}
                      </h3>
                      {renderStatusBadge(post.status)}
                    </div>
                    <p className="text-sm text-neutral-600 font-[Inter]">
                      Vendedor:{" "}
                      <span className="font-semibold text-neutral-800">
                        {post.user?.username || "Desconocido"}
                      </span>
                    </p>
                    <p className="text-sm text-neutral-600 font-[Inter]">
                      Precio:{" "}
                      <span className="font-semibold text-neutral-800">
                        {post.price ?? "N/D"}
                      </span>
                    </p>
                    <p className="text-sm text-neutral-600 font-[Inter]">
                      Creado:{" "}
                      <span className="font-semibold text-neutral-800">
                        {formatDate(post.created_at)}
                      </span>
                    </p>
                    <p className="text-sm text-neutral-600 font-[Inter]">
                      Visibilidad:{" "}
                      <span className="font-semibold text-neutral-800">
                        {post.visibility || "N/D"}
                      </span>
                    </p>
                    {post.images && post.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-2">
                        {post.images.map((img) => (
                          <img
                            key={img.image}
                            src={img.image}
                            alt={`img-${post.id}`}
                            className="w-20 h-20 object-cover rounded-md border border-neutral-200"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = "/placeholder-no-image.svg";
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {post.review_notes && (
                      <p className="text-xs text-neutral-600 font-[Inter] bg-white border border-neutral-200 rounded-md p-2">
                        Nota previa: {post.review_notes}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-auto">
                      <div className="flex flex-col gap-2 w-full">
                        <label className="text-xs font-[Inter] text-neutral-700">
                          Cambiar estado
                        </label>
                        <select
                          value={statusSelection[post.id] ?? post.status ?? ""}
                          onChange={(e) =>
                            setStatusSelection((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm font-[Inter]"
                        >
                          <option value="">Selecciona una opción</option>
                          <option value="active">Disponible</option>
                          <option value="reactivate">Reactivar 7 días</option>
                          <option value="pending_review">
                            Pasar a revisión
                          </option>
                          <option value="rejected">Rechazar</option>
                          <option value="paused">Pausar</option>
                          <option value="expired">Expirar</option>
                          <option value="sold">Marcar vendido</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleApplyStatus(post)}
                          disabled={isProcessing}
                          className="px-3 py-2 text-sm font-[Inter] bg-[#448502] text-white rounded-md hover:bg-[#3C7602] disabled:opacity-60"
                        >
                          {isProcessing ? "Procesando..." : "Aplicar estado"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() =>
                  moderationHasPrev && fetchModerationPosts(moderationPage - 1)
                }
                disabled={moderationLoading || !moderationHasPrev}
                className="px-3 py-2 text-sm font-[Inter] border border-neutral-300 rounded-md bg-white hover:bg-neutral-100 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm font-[Inter] text-neutral-700">
                Página {moderationPage}
              </span>
              <button
                type="button"
                onClick={() =>
                  moderationHasNext && fetchModerationPosts(moderationPage + 1)
                }
                disabled={moderationLoading || !moderationHasNext}
                className="px-3 py-2 text-sm font-[Inter] border border-neutral-300 rounded-md bg-white hover:bg-neutral-100 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
