import type { Category } from "@/types/category";
import type { PostItem } from "@/types/post";

import { apiClient } from "./apiClient";

type MarketplaceParams = {
  search?: string;
  category?: number;
  ordering?: string;
};

export const getMarketplacePosts = (
  params: MarketplaceParams = {},
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", String(params.category));
  if (params.ordering) query.set("ordering", params.ordering);

  const qs = query.toString();
  const path = `/posts/marketplace/${qs ? `?${qs}` : ""}`;
  return apiClient.get<PostItem[]>(path, signal);
};

export const getMarketplacePost = (id: string, signal?: AbortSignal) =>
  apiClient.get<PostItem>(`/posts/marketplace/${id}/`, signal);

export const getCategories = (signal?: AbortSignal) =>
  apiClient.get<Category[]>(`/posts/categories/`, signal);

export const createMarketplacePost = (payload: FormData) => {
  return apiClient.post(`/posts/my-listings/`, payload);
};

export const getMyPosts = (signal?: AbortSignal) =>
  apiClient.get<PostItem[]>(`/posts/my-listings/`, signal);
