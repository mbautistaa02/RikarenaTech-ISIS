export interface Department {
  id?: number;
  name: string;
  municipalities?: Municipality[];
  municipality_count?: number;
}

export interface Municipality {
  id?: number;
  name: string;
  department?: Department;
}

export interface UserProfile {
  id?: number;
  bio?: string;
  picture_url?: string;
  municipality?: Municipality;
  cellphone_number?: string | number | null;
  registration_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CurrentUser {
  id?: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile?: UserProfile;
}

export interface UpdateProfilePayload {
  cellphone_number?: string | number | null;
  municipality?: number;
  first_name?: string;
  last_name?: string;
  picture_url?: string;
  username?: string;
  bio?: string;
}
