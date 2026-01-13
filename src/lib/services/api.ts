import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
  const selectedBranch = localStorage.getItem("motolink_selected_branch");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (selectedBranch) {
    config.headers["X-Branch-Id"] = selectedBranch;
  }

  return config;
});
