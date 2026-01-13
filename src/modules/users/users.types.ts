export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  document: string;
  permissions: string[];
  branches: string[];
  birthDate: string;
  documents: Array<{ url: string; type: string; uploadedAt: string }>;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  verificationTokens?: Array<{ token: string }>;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UserListResponse {
  data: User[];
  count: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "USER";
  birthDate: string;
  permissions?: string[];
  documents?: Array<{ url: string; type: string; uploadedAt: string }>;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string;
}

export interface ChangePasswordData {
  id: string;
  password: string;
  passwordConfirmation: string;
  token: string;
}
