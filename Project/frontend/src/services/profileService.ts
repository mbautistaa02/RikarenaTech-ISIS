import type {
  CurrentUser,
  Department,
  UpdateProfilePayload,
} from "@/types/profile";

import { apiClient } from "./apiClient";

export const getCurrentUserProfile = (signal?: AbortSignal) =>
  apiClient.get<CurrentUser>("/users/me/", signal);

export const updateUserProfile = (
  username: string,
  payload: UpdateProfilePayload,
) =>
  apiClient.patch<CurrentUser, UpdateProfilePayload>(
    `/users/${username}/profile/`,
    payload,
  );

export const getDepartmentsWithMunicipalities = (signal?: AbortSignal) =>
  apiClient.get<Department[]>("/users/departments/", signal);
