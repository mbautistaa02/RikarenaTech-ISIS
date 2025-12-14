export type PostImage = {
  image: string;
};

export type PostItem = {
  is_available?: boolean;
  status?: string;
  visibility?: string;
  is_featured?: boolean;
  review_notes?: string;
  user?: {
    username?: string;
  };
  reviewed_by?: {
    username?: string;
  };
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  category?: {
    id?: string | number;
    name?: string;
  };
  id: number;
  title: string;
  content?: string;
  desc?: string;
  price?: number | string;
  quantity?: number | string;
  unit_of_measure?: string;
  images?: PostImage[];
  municipality?: {
    name?: string;
    department?: { name?: string };
  };
};

export interface CreatePostPayload {
  title: string;
  content: string;
  desc: string;
  price: number | string;
  images: string;
  quantity: number;
}
