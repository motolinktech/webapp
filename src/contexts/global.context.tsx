import { createContext, type ReactNode, useContext, useState } from "react";
import { clearAuth, getStoredUser } from "@/lib/modules/auth/auth.service";
import type { User } from "@/lib/modules/auth/auth.types";

interface GlobalContextType {
	user: User | null;
	setUser: (user: User | null) => void;
	logout: () => void;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export function GlobalProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => getStoredUser());

	const logout = () => {
		clearAuth();
		setUser(null);
	};

	return (
		<GlobalContext.Provider value={{ user, setUser, logout }}>
			{children}
		</GlobalContext.Provider>
	);
}

export function useGlobal() {
	const context = useContext(GlobalContext);
	if (!context) {
		throw new Error("useGlobal must be used within a GlobalProvider");
	}
	return context;
}
