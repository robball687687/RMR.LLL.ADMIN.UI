import api from "../lib/apiClient";

export const tasksApi = {
  list: async ({ status, page = 1, pageSize = 50 } = {}) =>
    (await api.get("/tasks", { params: { status, page, pageSize } })).data,
  create: async ({ title, themeId, ownerUserId, dueUtc }) =>
    (await api.post("/tasks", { title, themeId, ownerUserId, dueUtc })).data,
  setStatus: async (taskId, status) =>
    (await api.patch(`/tasks/${taskId}/status`, { status })).data,
};
