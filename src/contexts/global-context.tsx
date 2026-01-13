import { createContext, type ReactNode, useContext, useState } from "react";
import { clearAuth, getStoredUser } from "@/modules/auth/auth.service";
import { getStoreBranch } from "@/modules/branches/branches.service";
import type { Branch } from "@/modules/branches/branches.types";
import type { User } from "@/modules/users/users.types";

interface GlobalContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  logout: () => void;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(() => getStoreBranch());


  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <GlobalContext.Provider value={{ user, setUser, selectedBranch, setSelectedBranch, logout }}>{children}</GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
}
