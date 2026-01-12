import type { User } from "../users/users.types";

export interface AuthCredentials {
	email: string;
	password: string;
}


export interface AuthResponse {
	user: User;
	token: string;
}
