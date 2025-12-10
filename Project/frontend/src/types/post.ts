export type PostImage = {
  image: string;
};

export type PostItem = {
  is_available?: boolean;
  category?: {
    id?: string | number;
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
