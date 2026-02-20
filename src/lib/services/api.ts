import axios, { AxiosError } from "axios";
import type { ApiError } from "@/lib/types/api-types";
import { getStoreBranch } from "@/modules/branches/branches.service";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado",
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export const publicApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("motolink_token");
  const selectedBranch = getStoreBranch()?.id;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (selectedBranch) {
    config.headers["X-Branch-Id"] = selectedBranch;
  }

  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof AxiosError && error.response?.status === 401) {
      const appVersion = localStorage.getItem("app_version");
      localStorage.clear();
      if (appVersion) {
        localStorage.setItem("app_version", appVersion);
      }

      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
