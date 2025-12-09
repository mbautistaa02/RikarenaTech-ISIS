import React, { useEffect, useMemo, useState } from "react";

import { showToast } from "@/lib/toast";
import {
  getCurrentUserProfile,
  getDepartmentsWithMunicipalities,
  updateUserProfile,
} from "@/services/profileService";
import type { CurrentUser, Department, Municipality } from "@/types/profile";

type FormState = {
  username: string;
  bio: string;
  cellphone: string;
  departmentId: number | "";
  municipalityId: number | "";
  picture: string;
};

export const Profile: React.FC = () => {
  const [myInfo, setMyInfo] = useState<CurrentUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState<FormState>({
    username: "",
    bio: "",
    cellphone: "",
    departmentId: "",
    municipalityId: "",
    picture: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const municipalities: Municipality[] = useMemo(() => {
    const selected = departments.find((dept) => dept.id === form.departmentId);
    return selected?.municipalities ?? [];
  }, [departments, form.departmentId]);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const info = await getCurrentUserProfile(controller.signal);
        setMyInfo(info);
        setForm({
          username: info.username || "",
          bio: info.profile?.bio || "",
          cellphone: (info.profile?.cellphone_number ?? "").toString(),
          departmentId: info.profile?.municipality?.department?.id || "",
          municipalityId: info.profile?.municipality?.id || "",
          picture: info.profile?.picture_url || "",
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching profile", err);
          showToast(
            "error",
            "No se pudo cargar tu perfil. Intenta nuevamente.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
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
          showToast("error", "No pudimos cargar los departamentos.");
          setDepartments([]);
        }
      }
    };

    loadDepartments();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!form.departmentId && form.municipalityId) {
      setForm((prev) => ({ ...prev, municipalityId: "" }));
      return;
    }

    if (
      form.municipalityId &&
      !municipalities.some((mun) => mun.id === form.municipalityId)
    ) {
      setForm((prev) => ({ ...prev, municipalityId: "" }));
    }
  }, [form.departmentId, form.municipalityId, municipalities]);

  const handleSave = async () => {
    if (!myInfo?.username) return;
    setSaving(true);
    try {
      const payload = {
        first_name: form.username,
        bio: form.bio,
        cellphone_number: form.cellphone || null,
        municipality: form.municipalityId || undefined,
      };

      const updated = await updateUserProfile(myInfo.username, payload);
      setMyInfo(updated);
      showToast("success", "Perfil actualizado correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showToast("error", "Error al actualizar: " + message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex bg-gray-50 justify-center px-4 py-12">
        <div className="animate-pulse text-neutral-500">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="w-full flex bg-gray-50 justify-center px-4">
      <div className="w-full mt-10 mb-10 max-w-3xl bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-[30px] font-[Outfit] font-bold text-neutral-900">
          Editar perfil
        </h1>

        <p className="text-[16px] text-neutral-600 mt-2 font-[Inter]">
          Actualiza tu información personal
        </p>

        <h2 className="text-[18px] font-semibold mt-10 font-[Outfit]">
          Foto de perfil
        </h2>

        <div className="flex items-center gap-6 mt-4">
          <div className="w-[120px] h-[120px] rounded-full overflow-hidden">
            <img
              src={form.picture || "/farmer.jpg"}
              className="w-full h-full object-cover"
              alt="Foto"
            />
          </div>

          <button className="border hidden border-neutral-200 hover:bg-gray-50 rounded-md h-10 px-4 text-primary-500 font-medium">
            Cambiar foto
          </button>
        </div>

        <h2 className="text-[18px] font-semibold mt-10 font-[Outfit]">
          Información personal
        </h2>

        <div className="mt-4">
          <label className="font-medium text-[14px] text-neutral-900 font-[Inter]">
            Nombre de usuario
          </label>
          <input
            type="text"
            className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md"
            value={form.username}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, username: e.target.value }))
            }
          />
        </div>

        <div className="mt-6">
          <label className="font-medium text-[14px] text-neutral-900 font-[Inter]">
            Descripción
          </label>
          <textarea
            className="w-full h-[100px] mt-1 p-3 border border-neutral-300 rounded-md"
            value={form.bio}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bio: e.target.value }))
            }
          />

          <label className="font-medium text-[14px] text-neutral-900 font-[Inter] mt-4 block">
            Teléfono
          </label>
          <input
            type="text"
            className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md"
            value={form.cellphone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cellphone: e.target.value }))
            }
          />
        </div>

        <div className="mt-4">
          <label className="font-medium text-[14px] text-neutral-900">
            Departamento
          </label>
          <select
            className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md"
            value={form.departmentId === "" ? "" : String(form.departmentId)}
            onChange={(e) => {
              const value = e.target.value;
              setForm((prev) => ({
                ...prev,
                departmentId: value ? Number(value) : "",
              }));
            }}
          >
            <option value="">Selecciona un departamento</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <label className="font-medium text-[14px] text-neutral-900 mt-3">
            Municipio
          </label>
          <select
            className="w-full h-[45px] mt-1 px-3 border border-neutral-300 rounded-md"
            value={
              form.municipalityId === "" ? "" : String(form.municipalityId)
            }
            onChange={(e) => {
              const value = e.target.value;
              setForm((prev) => ({
                ...prev,
                municipalityId: value ? Number(value) : "",
              }));
            }}
            disabled={!form.departmentId}
          >
            <option value="">Selecciona un municipio</option>
            {municipalities.map((mun) => (
              <option key={mun.id} value={mun.id}>
                {mun.name}
              </option>
            ))}
          </select>
        </div>

        <h2 className="text-[18px] font-semibold mt-10 font-[Outfit]">
          Notificaciones
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="peer appearance-none w-4 h-4 border border-neutral-400 rounded checked:bg-green-600 transition"
            />
            <span>Recibir alertas</span>
          </label>
        </div>

        <div className="flex justify-end gap-4 mt-12">
          <button
            onClick={handleSave}
            disabled={!myInfo || saving}
            className={`w-[129px] h-10 px-3 flex items-center justify-center rounded-md 
        ${!myInfo || saving ? "bg-gray-300" : "bg-[#448502] hover:bg-[#3C7602]"} text-white`}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};
