import { publicApi } from "@/lib/services/api";
import type { AuthCredentials, AuthResponse, User } from "./auth.types";

const TOKEN_KEY = "motolink_token";
const USER_KEY = "motolink_user";

export async function authenticate(
	credentials: AuthCredentials,
): Promise<AuthResponse> {
	const response = await publicApi.post<AuthResponse>("/auth/", credentials);
	return response.data;
}

export function saveAuth(token: string, user: User): void {
	localStorage.setItem(TOKEN_KEY, token);
	localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
	return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
	const user = localStorage.getItem(USER_KEY);
	return user ? JSON.parse(user) : null;
}

export function clearAuth(): void {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
	return !!getToken();
}
