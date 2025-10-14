// src/lib/apiClient.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7145/api", // e.g. https://localhost:7145/api
  withCredentials: false
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lll_token");
  const orgId = localStorage.getItem("lll_orgId");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (orgId) config.headers["X-OrgId"] = orgId;
  return config;
});

export default api;
