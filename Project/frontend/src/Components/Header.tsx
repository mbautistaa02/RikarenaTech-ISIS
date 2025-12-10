import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

interface UserGroup {
  id: number;
  name: string;
}

export const Header: React.FC = () => {
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [isModerator, setIsModerator] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch user data to check if moderator
    fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((response) => {
        if (response.data && response.data.groups) {
          const groups = response.data.groups;
          const hasModerator = groups.some(
            (group: UserGroup) => group.name === "moderators",
          );
          setIsModerator(hasModerator);
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });

    // Fetch unread alerts count
    const lastVisitTimestamp = localStorage.getItem("lastAlertsVisit");

    fetch(`${import.meta.env.VITE_API_BASE_URL}/alerts/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          if (!lastVisitTimestamp) {
            setUnreadAlertsCount(response.data.length);
          } else {
            const lastVisit = new Date(lastVisitTimestamp);
            const newAlerts = response.data.filter((alert: any) => {
              const alertCreated = new Date(alert.created_at);
              return alertCreated > lastVisit;
            });
            setUnreadAlertsCount(newAlerts.length);
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching alerts count:", error);
      });

    // Close mobile menu when resizing to large screens
    const onResize = () => {
      if (window.innerWidth >= 1024 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
      <div className=" mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        {/* Logo + Links */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <h1 className="text-[40px] font-bold font-[Outfit] text-[#448502]">
            ISIS
          </h1>

          {/* Nav Links */}
          {/* show inline nav only on large screens and up; on smaller screens nav will be in the mobile dropdown */}
          <nav className="hidden lg:flex items-center space-x-6">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `text-sm font-[Inter] transition ${
                  isActive
                    ? "text-[#448502] font-semibold"
                    : "text-[#171A1F] hover:text-[#3C7602]"
                }`
              }
            >
              Productos
            </NavLink>
            <NavLink
              to="/sellers"
              className={({ isActive }) =>
                `text-sm font-[Inter] ${
                  isActive
                    ? "text-[#448502] font-semibold"
                    : "text-[#171A1F] hover:text-[#3C7602]"
                }`
              }
            >
              Vendedores
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `text-sm font-[Inter] ${
                  isActive
                    ? "text-[#448502] font-semibold"
                    : "text-[#171A1F] hover:text-[#3C7602]"
                }`
              }
            >
              Mi perfil
            </NavLink>

            {/* Botón con dropdown para crear */}
            <div className="relative group">
              <button className="text-sm font-[Inter] text-[#171A1F] hover:text-[#3C7602] transition flex items-center">
                Crear <span className="ml-1">▾</span>
              </button>

              {/* Dropdown */}
              <div className="absolute left-0 mt-2 w-40 bg-white shadow-md rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <NavLink
                  to="/create_post"
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm font-[Inter] transition ${
                      isActive
                        ? "text-[#448502] font-semibold"
                        : "text-[#171A1F] hover:bg-gray-100 hover:text-[#448502]"
                    }`
                  }
                >
                  Crear publicación
                </NavLink>

                <NavLink
                  to="/create_crop"
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm font-[Inter] transition ${
                      isActive
                        ? "text-[#448502] font-semibold"
                        : "text-[#171A1F] hover:bg-gray-100 hover:text-[#448502]"
                    }`
                  }
                >
                  Crear cultivo
                </NavLink>
              </div>
            </div>

            <NavLink
              to="/my_products"
              className={({ isActive }) =>
                `text-sm font-[Inter] ${
                  isActive
                    ? "text-[#448502] font-semibold"
                    : "text-[#171A1F] hover:text-[#3C7602]"
                }`
              }
            >
              Mis productos y cultivos
            </NavLink>

            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                `text-sm font-[Inter] relative ${
                  isActive
                    ? "text-[#448502] font-semibold"
                    : "text-[#171A1F] hover:text-[#3C7602]"
                }`
              }
            >
              Alertas
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadAlertsCount}
                </span>
              )}
            </NavLink>

            {isModerator && (
              <NavLink
                to="/moderador"
                className={({ isActive }) =>
                  `text-sm font-[Inter] ${
                    isActive
                      ? "text-[#448502] font-semibold"
                      : "text-[#171A1F] hover:text-[#3C7602]"
                  }`
                }
              >
                Moderador
              </NavLink>
            )}
          </nav>
        </div>

        {/* Botón */}
        <div className="gap-2 flex">
          <a
            href={`${import.meta.env.VITE_API_BASE_URL}/auth/google/login/?process=login`}
          >
            <button className=" sm:flex items-center justify-center px-4 py-2 h-9 rounded-md bg-[#448502] text-white text-sm font-medium hover:bg-[#3C7602] active:bg-[#2F5D01] font-[Inter] transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
              Login
            </button>
          </a>
          <a href={`${import.meta.env.VITE_API_BASE_URL}/auth/logout/`}>
            <button className=" sm:flex items-center justify-center px-4 py-2 h-9 rounded-md bg-[#448502] text-white text-sm font-medium hover:bg-[#3C7602] active:bg-[#2F5D01] font-[Inter] transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
              Logout
            </button>
          </a>
        </div>

        {/* mobile menu button and dropdown - visible on screens < lg */}
        <div className="lg:hidden relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            className="text-[#171A1F] focus:outline-none p-2 rounded-md hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-2 top-full mt-2 w-56 bg-white shadow-md rounded-md z-50">
              <nav className="flex flex-col py-2">
                <NavLink
                  to="/products"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-[Inter] ${
                      isActive
                        ? "text-[#448502] font-semibold"
                        : "text-[#171A1F] hover:bg-gray-100"
                    }`
                  }
                >
                  Productos
                </NavLink>

                <NavLink
                  to="/sellers"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-[Inter] ${
                      isActive
                        ? "text-[#448502] font-semibold"
                        : "text-[#171A1F] hover:bg-gray-100"
                    }`
                  }
                >
                  Vendedores
                </NavLink>

                <NavLink
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-[Inter] ${
                      isActive
                        ? "text-[#448502] font-semibold"
                        : "text-[#171A1F] hover:bg-gray-100"
                    }`
                  }
                >
                  Mi perfil
                </NavLink>

                <NavLink
                  to="/create_post"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-[Inter] ${
                      isActive
                        ? "text-[#448502] font-semibold"
                        : "text-[#171A1F] hover:bg-gray-100"
                    }`
                  }
                >
                  Crear publicación
                </NavLink>

                <NavLink
                  to="/create_crop"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-[Inter] ${
                      isActive
                        ? "text-[#448502] font-semibold"
                        : "text-[#171A1F] hover:bg-gray-100"
                    }`
                  }
                >
                  Crear cultivo
                </NavLink>

                <NavLink
                  to="/my_products"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-[Inter] ${
                      isActive
                        ? "text-[#448502] font-semibold"
                        : "text-[#171A1F] hover:bg-gray-100"
                    }`
                  }
                >
                  Mis productos y cultivos
                </NavLink>

                <NavLink
                  to="/alerts"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-[Inter] relative ${
                      isActive
                        ? "text-[#448502] font-semibold"
                        : "text-[#171A1F] hover:bg-gray-100"
                    }`
                  }
                >
                  Alertas
                </NavLink>

                {isModerator && (
                  <NavLink
                    to="/moderador"
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2 text-sm font-[Inter] ${
                        isActive
                          ? "text-[#448502] font-semibold"
                          : "text-[#171A1F] hover:bg-gray-100"
                      }`
                    }
                  >
                    Moderador
                  </NavLink>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
