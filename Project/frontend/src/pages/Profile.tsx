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

type FormErrors = {
  bio?: string;
  cellphone?: string;
  picture?: string;
  municipality?: string;
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shouldValidate, setShouldValidate] = useState(false); // Solo validar cuando se intente guardar

  const municipalities: Municipality[] = useMemo(() => {
    const selected = departments.find((dept) => dept.id === form.departmentId);
    return selected?.municipalities ?? [];
  }, [departments, form.departmentId]);

  // Memoize runValidation to avoid dependency array issues
  const runValidationMemo = useMemo(() => {
    return (nextForm: FormState): FormErrors => {
      const e: FormErrors = {};
      const bio = sanitizeText(nextForm.bio, 1000);
      if (bio.length > 800)
        e.bio = "Descripción muy larga (máx 800 caracteres).";

      const phoneErr = validatePhone(nextForm.cellphone);
      if (phoneErr) e.cellphone = phoneErr;

      const picErr = validateImageUrl(nextForm.picture);
      if (picErr) e.picture = picErr;

      if (nextForm.municipalityId && !nextForm.departmentId) {
        e.municipality = "Selecciona primero un departamento.";
      }

      return e;
    };
  }, []);

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

  // Simple sanitizers / validators (client-side)
  const sanitizeText = (value: string, maxLen = 1000) => {
    // Remove tags, control chars and trim
    const withoutTags = value
      .replace(/<[^>]*>/g, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, "");
    return withoutTags.trim().slice(0, maxLen);
  };

  const validatePhone = (value: string) => {
    if (!value) return null;
    const digits = value.replace(/[^0-9+]/g, "");
    // Accept between 7 and 15 digits (with optional +)
    const digitsOnly = digits.replace(/\+/g, "");
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return "Número inválido (7-15 dígitos).";
    }
    return null;
  };

  const validateImageUrl = (value: string) => {
    if (!value) return null;

    // Permitir URLs https, http, o rutas relativas que parecen razonables
    const isValidUrl =
      /^https?:\/\/.+/.test(value) || // URLs con https://http://
      /^\//.test(value) || // Rutas relativas como /farmer.jpg
      /^\.\//.test(value); // Rutas relativas como ./image.jpg

    if (!isValidUrl) {
      return "La URL de imagen no parece válida.";
    }

    return null;
  };

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

  // Re-validate when form changes (but only if validation has been triggered)
  useEffect(() => {
    if (shouldValidate) {
      const newErrors = runValidationMemo(form);
      setErrors(newErrors);
    }
  }, [form, shouldValidate, runValidationMemo]);

  const handleSave = async () => {
    if (!myInfo?.username) return;
    setSaving(true);
    setShouldValidate(true); // Activar validación
    try {
      // Final sanitization before send
      const cleanedBio = sanitizeText(form.bio, 1000);
      const cleanedPhone = (form.cellphone || "").replace(/[^0-9+]/g, "");
      const cleanedPicture = form.picture ? String(form.picture).trim() : "";

      const nextErrors = runValidationMemo({
        ...form,
        bio: cleanedBio,
        cellphone: cleanedPhone,
        picture: cleanedPicture,
      });
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        showToast(
          "error",
          "Corrige los errores del formulario antes de guardar.",
        );
        setSaving(false);
        return;
      }

      const payload = {
        first_name: form.username,
        bio: cleanedBio || undefined,
        cellphone_number: cleanedPhone ? parseInt(cleanedPhone, 10) : undefined,
        municipality: form.municipalityId ? form.municipalityId : undefined,
        picture_url: cleanedPicture || undefined,
      };

      const updated = await updateUserProfile(myInfo.username, payload);

      if (updated && updated.username) {
        setMyInfo(updated);
        showToast("success", "Perfil actualizado correctamente.");
      } else {
        console.warn("⚠️ Respuesta inesperada:", updated);
        showToast("error", "La respuesta del servidor no es válida.");
      }
    } catch (err) {
      console.error("❌ Error al guardar:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
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
            readOnly
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
          {errors.bio && (
            <div className="text-sm text-red-600 mt-1">{errors.bio}</div>
          )}

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
          {errors.cellphone && (
            <div className="text-sm text-red-600 mt-1">{errors.cellphone}</div>
          )}
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
          {errors.municipality && (
            <div className="text-sm text-red-600 mt-1">
              {errors.municipality}
            </div>
          )}

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
