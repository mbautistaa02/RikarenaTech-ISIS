import { useEffect, useState } from "react";

interface AlertImage {
  image: string;
  uploaded_at: string;
}

interface AlertCategory {
  category_name: string;
  description: string;
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

interface AlertCardProps {
  title: string;
  description: string;
  images?: AlertImage[];
  category?: string;
}

function AlertCard({ title, description, images, category }: AlertCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 border border-red-100">
      {category && (
        <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          {category}
        </span>
      )}
      <h2 className="text-[20px] font-bold font-[Outfit] text-neutral-900 mb-2">
        {title}
      </h2>
      <p className="text-neutral-700 font-[Inter] text-sm leading-relaxed mb-4">
        {description}
      </p>

      {images && images.length > 0 && (
        <div
          className={`mt-4 ${images.length === 1 ? "" : "grid grid-cols-2 gap-2"}`}
        >
          {images.map((img, index) => (
            <img
              key={index}
              src={img.image}
              alt={`alert-image-${index + 1}`}
              className={`w-full ${images.length === 1 ? "h-40" : "h-32"} object-cover rounded-md`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMunicipality, setHasMunicipality] = useState(true);

  useEffect(() => {
    // Guardar el timestamp actual como última visita
    const now = new Date().toISOString();
    localStorage.setItem("lastAlertsVisit", now);

    // First, check if user has municipality configured
    fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((response) => {
        if (response.data && response.data.profile) {
          const municipality = response.data.profile.municipality;

          if (!municipality) {
            setHasMunicipality(false);
            setLoading(false);
            return;
          }

          // If has municipality, fetch alerts
          fetchAlerts();
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        setError("Error al verificar tu perfil");
        setLoading(false);
      });
  }, []);

  const fetchAlerts = () => {
    // Fetch alerts from backend
    fetch(`${import.meta.env.VITE_API_BASE_URL}/alerts/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((response) => {
        console.log("Alerts response:", response);
        if (response.data && Array.isArray(response.data)) {
          setAlerts(response.data);
        } else {
          setError("No se pudieron cargar las alertas");
        }
      })
      .catch((error) => {
        console.error("Error fetching alerts:", error);
        setError("Error al cargar las alertas");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-14 py-10">
      <h1 className="text-center text-[32px] font-bold text-neutral-900 mb-10">
        Alertas
      </h1>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-neutral-600">Cargando alertas...</div>
      )}

      {/* Error State */}
      {error && <div className="text-center text-red-600">{error}</div>}

      {/* Municipality Not Configured */}
      {!loading && !hasMunicipality && (
        <div className="max-w-md mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">
              ¡Configura tu ubicación!
            </h3>
            <p className="text-neutral-700 mb-6 leading-relaxed">
              Para ver las alertas relevantes de tu zona, necesitas configurar
              tu departamento y municipio en tu perfil.
            </p>
            <a href="/profile">
              <button className="bg-[#448502] hover:bg-[#3C7602] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                Ir a Mi Perfil
              </button>
            </a>
          </div>
        </div>
      )}

      {/* GRID DE ALERTAS */}
      {!loading && !error && hasMunicipality && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                title={alert.alert_title}
                description={alert.alert_message}
                category={alert.category.category_name}
                images={alert.images}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-neutral-600">
              No hay alertas disponibles en este momento
            </div>
          )}
        </div>
      )}
    </div>
  );
}
