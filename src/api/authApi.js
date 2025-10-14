// src/api/authApi.js
import api from "../lib/apiClient";
export const authApi = {
  devToken: async (orgId, email) =>
    (await api.post("/auth/dev-token", { orgId, email })).data.access_token
};
