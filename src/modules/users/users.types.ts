import type { User } from "../auth/auth.types";

export type { User };

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
