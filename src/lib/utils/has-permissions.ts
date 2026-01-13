import type { User } from "@/modules/users/users.types";

export function hasPermissions(user: User, permission: string): boolean {
	if (user.role === "ADMIN") {
		return true;
	}

	return user.permissions.includes(permission);
}
