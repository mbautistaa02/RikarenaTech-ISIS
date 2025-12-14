import type { Category } from "@/types/category";
import type { PostItem } from "@/types/post";

import { apiClient } from "./apiClient";

type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

type MarketplaceParams = {
  search?: string;
  category?: number;
  ordering?: string;
  municipality?: number;
  department?: number;
  minPrice?: number | string;
  maxPrice?: number | string;
};

export const getMarketplacePosts = (
  params: MarketplaceParams = {},
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", String(params.category));
  if (params.ordering) query.set("ordering", params.ordering);
  if (params.municipality)
    query.set("municipality", String(params.municipality));
  if (params.department) query.set("department", String(params.department));
  if (params.minPrice !== undefined && params.minPrice !== null)
    query.set("min_price", String(params.minPrice));
  if (params.maxPrice !== undefined && params.maxPrice !== null)
    query.set("max_price", String(params.maxPrice));

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

export const patchMyPost = (id: string, formData: FormData) => {
  return apiClient.patch(`/posts/my-listings/${id}/`, formData);
};

export const deleteMarketplacePost = (id: number, signal?: AbortSignal) => {
  return apiClient.delete<{ success: boolean }>(
    `/posts/my-listings/${id}/`,
    signal,
  );
};

export const markPostAsSold = (id: number) =>
  apiClient.patch<PostItem>(`/posts/my-listings/${id}/mark_as_sold/`, {});

// Moderation endpoints
export const getPostsForModeration = (
  page = 1,
  signal?: AbortSignal,
): Promise<Paginated<PostItem> | PostItem[]> => {
  const query = new URLSearchParams();
  if (page) query.set("page", String(page));
  const qs = query.toString();
  const path = `/posts/moderation/${qs ? `?${qs}` : ""}`;
  return apiClient.get<Paginated<PostItem>>(path, signal);
};

export const updateModerationPost = (
  id: number,
  payload: Partial<Pick<PostItem, "status" | "review_notes">>,
) => apiClient.patch<PostItem>(`/posts/moderation/${id}/`, payload);

export const reactivatePost = (id: number) =>
  apiClient.patch<PostItem>(`/posts/moderation/${id}/reactivate/`, {});
