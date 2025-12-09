import type { UserProfile } from "./profile";

export type Seller = {
  id?: number;
  username: string;
  email?: string;
  profile?: UserProfile & { picture_url?: string };
  active_posts_count?: number;
  total_posts_count?: number;
  latest_post_date?: string;
};
