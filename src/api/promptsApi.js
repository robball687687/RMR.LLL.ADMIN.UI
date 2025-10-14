import api from "../lib/apiClient";

export const promptsApi = {
  list: async () => (await api.get("/prompts")).data,
  create: async (name, channel) => (await api.post("/prompts", { name, channel })).data,

  // NEW: preferred (single round-trip)
  listWithStats: async ({ fromUtc, toUtc } = {}) =>
    (await api.get("/prompts/stats", { params: { fromUtc, toUtc } })).data,
};
