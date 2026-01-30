import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const checkVersion = () => {
      fetch("/version.txt")
        .then((res) => res.text())
        .then((version) => {
          const trimmedVersion = version.trim();
          const storedVersion = localStorage.getItem("app_version");

          if (!storedVersion) {
            localStorage.setItem("app_version", trimmedVersion);
            return;
          }

          if (storedVersion !== trimmedVersion) {
            localStorage.setItem("app_version", trimmedVersion);
            window.location.reload();
          }
        })
        .catch(() => {
          // Silently fail if version.txt doesn't exist (dev mode)
        });
    };

    checkVersion();
    const intervalId = setInterval(checkVersion, 60000);

    return () => clearInterval(intervalId);
  }, []);

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
