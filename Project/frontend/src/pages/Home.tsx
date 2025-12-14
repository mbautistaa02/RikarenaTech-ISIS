import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCategories, getMarketplacePosts } from "@/services/postsService";
import { getDepartmentsWithMunicipalities } from "@/services/profileService";
import type { Category } from "@/types/category";
import type { PostItem } from "@/types/post";
import type { Department, Municipality } from "@/types/profile";

export const Home: React.FC = () => {
  const [items, setItems] = useState<PostItem[]>([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [ordering, setOrdering] = useState<string>("-published_at");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | "">("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<number | "">(
    "",
  );
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchData = async (opts?: {
    search?: string;
    category?: number | "";
    ordering?: string;
    department?: number | "";
    municipality?: number | "";
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const controller = new AbortController();
    setLoading(true);
    const effectiveSearch = opts?.search ?? search;
    const effectiveCategory =
      opts?.category !== undefined ? opts.category : selectedCategory;
    const effectiveOrdering = opts?.ordering ?? ordering;
    const effectiveDepartment =
      opts?.department !== undefined ? opts.department : selectedDepartment;
    const effectiveMunicipality =
      opts?.municipality !== undefined
        ? opts.municipality
        : selectedMunicipality;
    const effectiveMinPrice = opts?.minPrice ?? minPrice;
    const effectiveMaxPrice = opts?.maxPrice ?? maxPrice;

    const parseNumber = (value: string | number | "") => {
      if (value === "" || value === undefined || value === null)
        return undefined;
      const numeric = typeof value === "number" ? value : Number(value);
      return Number.isFinite(numeric) ? numeric : undefined;
    };

    try {
      const data = await getMarketplacePosts(
        {
          search: effectiveSearch || undefined,
          category:
            effectiveCategory && !Number.isNaN(Number(effectiveCategory))
              ? Number(effectiveCategory)
              : undefined,
          ordering: effectiveOrdering,
          department:
            effectiveDepartment && !Number.isNaN(Number(effectiveDepartment))
              ? Number(effectiveDepartment)
              : undefined,
          municipality:
            effectiveMunicipality &&
            !Number.isNaN(Number(effectiveMunicipality))
              ? Number(effectiveMunicipality)
              : undefined,
          minPrice: parseNumber(effectiveMinPrice),
          maxPrice: parseNumber(effectiveMaxPrice),
        },
        controller.signal,
      );
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("Error fetching posts", err);
        setItems([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadCategories = async () => {
      try {
        const data = await getCategories(controller.signal);
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching categories", err);
          setCategories([]);
        }
      }
    };
    loadCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadDepartments = async () => {
      try {
        const data = await getDepartmentsWithMunicipalities(controller.signal);
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching departments", err);
          setDepartments([]);
        }
      }
    };
    loadDepartments();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedDepartment === "") {
      setMunicipalities([]);
      setSelectedMunicipality("");
      return;
    }
    const dept = departments.find((d) => d.id === selectedDepartment);
    const nextMunicipalities = dept?.municipalities ?? [];
    setMunicipalities(nextMunicipalities);
    if (
      selectedMunicipality &&
      !nextMunicipalities.some((m) => m.id === selectedMunicipality)
    ) {
      setSelectedMunicipality("");
    }
  }, [departments, selectedDepartment, selectedMunicipality]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSubmitSearch = () => {
    fetchData({ search });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitSearch();
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const next = value ? Number(value) : "";
    setSelectedCategory(next);
    fetchData({ category: next });
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const next = value ? Number(value) : "";
    setSelectedDepartment(next);
    setSelectedMunicipality("");
    fetchData({ department: next, municipality: "" });
  };

  const handleMunicipalityChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    const next = value ? Number(value) : "";
    setSelectedMunicipality(next);
    fetchData({ municipality: next });
  };

  useEffect(() => {
    // Preload first image of each fetched item to speed up card render
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      const src =
        item.images && item.images.length > 0
          ? item.images[0].image
          : "/blueberry.png";
      const img = new Image();
      img.src = src;
    });
  }, [items]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setOrdering(value);
    fetchData({ ordering: value });
  };

  const handleApplyPriceFilters = (overrides?: {
    minPrice?: string;
    maxPrice?: string;
  }) => {
    fetchData({
      minPrice: overrides?.minPrice ?? minPrice,
      maxPrice: overrides?.maxPrice ?? maxPrice,
    });
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setSelectedDepartment("");
    setSelectedMunicipality("");
    setMinPrice("");
    setMaxPrice("");
    fetchData({
      category: "",
      department: "",
      municipality: "",
      minPrice: "",
      maxPrice: "",
    });
  };

  const statusStyles: Record<string, { label: string; classes: string }> = {
    active: { label: "Disponible", classes: "bg-green-100 text-green-800" },
    pending_review: {
      label: "En revisión",
      classes: "bg-amber-100 text-amber-800",
    },
    rejected: { label: "Rechazado", classes: "bg-red-100 text-red-800" },
    sold: { label: "Vendido", classes: "bg-neutral-200 text-neutral-800" },
    expired: { label: "Expirado", classes: "bg-neutral-200 text-neutral-800" },
    paused: { label: "Pausado", classes: "bg-neutral-200 text-neutral-800" },
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    const info = statusStyles[status.toLowerCase()];
    if (!info) return null;
    return (
      <span
        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${info.classes}`}
      >
        {info.label}
      </span>
    );
  };

  const filteredItems = items.filter(
    (item) =>
      item.status !== "rejected" &&
      (item.visibility === "public" || item.visibility === undefined),
  );

  return (
    <section className="w-full  bg-neutral-50 flex flex-col items-center">
      {/* Banner */}
      <div className="relative w-full h-[350px]">
        <img
          src="/fruitsHome.png"
          alt="Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
        <div className="absolute inset-0 flex flex-col justify-center items-center">
          <h2 className="text-3xl font-[Outfit] font-bold text-white mb-2 text-center">
            Bienvenido a ISIS marketplace
          </h2>
          <p className="text-white font-[Inter] text-center">
            Explora los productos de nuestros vendedores destacados
          </p>
        </div>
      </div>

      {/* Bloque de búsqueda y filtros */}
      <div className="w-full max-w-[1184px] bg-neutral-100 border border-neutral-200 shadow-sm rounded-lg mt-10 px-4 py-5 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* 🔸 Campo de búsqueda */}
          <div className="flex w-full md:max-w-[480px]">
            <input
              type="text"
              placeholder="Buscar producto o región..."
              className="flex-1 h-11 px-3 text-sm outline-none font-[Inter] border border-neutral-300 border-r-0 rounded-l-md"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSubmitSearch}
              className="h-11 w-12 bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01] text-white flex items-center justify-center rounded-r-md border border-neutral-400 border-l-0"
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
                  d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </button>
          </div>

          {/* 🔸 Ordenar por */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-900 font-[Inter] font-medium text-base">
              Ordenar:
            </span>
            <div className="relative w-[200px]">
              <select
                value={ordering}
                onChange={handleSortChange}
                className="appearance-none w-full h-11 px-3 pr-8 border border-neutral-300 rounded-md font-[Inter] text-sm text-neutral-900 focus:outline-none bg-white"
              >
                <option value="-published_at">Más recientes</option>
                <option value="price">Precio: menor a mayor</option>
                <option value="-price">Precio: mayor a menor</option>
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 🔸 Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Categoría */}
          <div className="flex flex-col gap-1">
            <span className="text-neutral-800 font-[Inter] text-sm font-medium">
              Categoría
            </span>
            <div className="relative">
              <select
                value={selectedCategory === "" ? "" : String(selectedCategory)}
                onChange={handleCategoryChange}
                className="appearance-none w-full h-11 px-3 pr-8 border border-neutral-300 rounded-md font-[Inter] text-sm text-neutral-900 focus:outline-none bg-white"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Departamento */}
          <div className="flex flex-col gap-1">
            <span className="text-neutral-800 font-[Inter] text-sm font-medium">
              Departamento
            </span>
            <div className="relative">
              <select
                value={
                  selectedDepartment === "" ? "" : String(selectedDepartment)
                }
                onChange={handleDepartmentChange}
                className="appearance-none w-full h-11 px-3 pr-8 border border-neutral-300 rounded-md font-[Inter] text-sm text-neutral-900 focus:outline-none bg-white"
              >
                <option value="">Todos</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Municipio */}
          <div className="flex flex-col gap-1">
            <span className="text-neutral-800 font-[Inter] text-sm font-medium">
              Municipio
            </span>
            <div className="relative">
              <select
                value={
                  selectedMunicipality === ""
                    ? ""
                    : String(selectedMunicipality)
                }
                onChange={handleMunicipalityChange}
                disabled={!selectedDepartment}
                className="appearance-none w-full h-11 px-3 pr-8 border border-neutral-300 rounded-md font-[Inter] text-sm text-neutral-900 focus:outline-none bg-white disabled:bg-neutral-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedDepartment ? "Todos" : "Selecciona un departamento"}
                </option>
                {municipalities.map((mun) => (
                  <option key={mun.id} value={mun.id}>
                    {mun.name}
                  </option>
                ))}
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Precio */}
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-800 font-[Inter] text-sm font-medium">
                Precio mínimo
              </span>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={(e) =>
                  handleApplyPriceFilters({ minPrice: e.target.value })
                }
                className="h-11 px-3 border border-neutral-300 rounded-md font-[Inter] text-sm text-neutral-900 focus:outline-none"
                placeholder="$0"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-neutral-800 font-[Inter] text-sm font-medium">
                Precio máximo
              </span>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={(e) =>
                  handleApplyPriceFilters({ maxPrice: e.target.value })
                }
                className="h-11 px-3 border border-neutral-300 rounded-md font-[Inter] text-sm text-neutral-900 focus:outline-none"
                placeholder="$9999"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-600 font-[Inter]">
            Filtra por ubicación o rango de precios para encontrar productores
            cercanos.
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleApplyPriceFilters()}
              className="h-10 px-4 bg-[#448502] hover:bg-[#3C7602] active:bg-[#2F5D01] text-white rounded-md font-[Inter] text-sm"
            >
              Aplicar filtros
            </button>
            <button
              onClick={handleClearFilters}
              className="h-10 px-4 border border-neutral-300 hover:bg-neutral-200 text-neutral-800 rounded-md font-[Inter] text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Texto */}
      <div className="w-full px-4 md:px-15">
        <h2 className="mt-8 text-center md:text-left text-2xl md:text-[30px] leading-8 md:leading-9 font-[Outfit] font-bold text-neutral-900">
          Lo mejor, directo del campo local
        </h2>
      </div>

      {/* Todos productos desde back */}
      <div className="w-full bg-neutral-50 px-8 md:px-32 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && (
            <div className="col-span-full text-center text-neutral-500">
              Buscando productos...
            </div>
          )}
          {!loading && filteredItems.length === 0 && (
            <div className="col-span-full text-center text-neutral-500">
              No se encontraron productos.
            </div>
          )}
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="relative bg-white rounded-xl shadow-sm border border-transparent flex flex-col overflow-hidden"
            >
              {renderStatusBadge(item.status)}
              {/* Imagen */}
              <img
                src={
                  item.images && item.images.length > 0
                    ? item.images[0].image
                    : "/placeholder-no-image.svg"
                }
                alt={item.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = "/placeholder-no-image.svg";
                }}
              />

              {/* Contenido */}
              <div className="p-4">
                <h3 className="font-[Outfit] text-[18px] font-semibold text-neutral-900 mb-1">
                  {item.title}
                </h3>

                <p className="font-[Inter] text-[14px] text-neutral-600 mb-2">
                  {item.desc || item.content}
                </p>

                {item.municipality?.name && (
                  <div className="flex items-center gap-2 text-sm text-neutral-700 font-[Inter] mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-neutral-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 22s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"
                      />
                    </svg>
                    <span>
                      {item.municipality.name}
                      {item.municipality.department?.name
                        ? `, ${item.municipality.department.name}`
                        : ""}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-bold text-green-600">
                    ${item.price}
                  </span>

                  <Link
                    to={`/product_details/${item.id}`}
                    className="bg-white hover:bg-neutral-100 border border-neutral-300 active:bg-neutral-200 px-4 py-2 rounded-xl transition"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
