export interface AuthCredentials {
	email: string;
	password: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	role: "ADMIN" | "USER";
	status: "ACTIVE" | "INACTIVE" | "PENDING";
	permissions: string[];
	branches: string[];
	birthDate: string;
	documents: Array<{ url: string; type: string; uploadedAt: string }>;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AuthResponse {
	user: User;
	token: string;
}
