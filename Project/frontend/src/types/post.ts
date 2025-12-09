export type PostImage = {
  image: string;
};

export type PostItem = {
  id: number;
  title: string;
  content?: string;
  desc?: string;
  price?: number | string;
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