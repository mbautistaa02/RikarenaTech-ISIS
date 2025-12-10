import type { Seller } from "@/types/seller";

import { apiClient } from "./apiClient";

type SellerParams = {
  search?: string;
};

export const getSellers = (params: SellerParams = {}, signal?: AbortSignal) => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);

  const qs = query.toString();
  const path = `/users/sellers/${qs ? `?${qs}` : ""}`;
  return apiClient.get<Seller[]>(path, signal);
};

export const getSeller = (username: string, signal?: AbortSignal) =>
  apiClient.get<Seller>(`/users/sellers/${username}/`, signal);

export const getSellerPosts = (username: string, signal?: AbortSignal) =>
  apiClient.get(`/users/sellers/${username}/posts/`, signal);
