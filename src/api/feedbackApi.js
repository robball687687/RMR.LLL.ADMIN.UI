// src/api/feedbackApi.js
import api from "../lib/apiClient";

export const feedbackApi = {
  // existing
  create: async ({ orgId, promptId, rating, text, source = "web", locationId = null }) =>
    (await api.post("/feedback", { orgId, promptId, rating, text, source, locationId })).data,

  // NEW: list/query with filters (promptId, dates, pagination)
  query: async ({ fromUtc, toUtc, promptId, locationId, page = 1, pageSize = 50 }) =>
    (await api.get("/feedback", {
      params: { fromUtc, toUtc, promptId, locationId, page, pageSize },
    })).data,
};
