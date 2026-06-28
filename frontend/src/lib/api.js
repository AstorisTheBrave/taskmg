const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

export function signup(name, email, password, inviteCode) {
  return request("/auth/signup", { method: "POST", body: { name, email, password, inviteCode } });
}

export function listTasks(token, params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return request(`/tasks${query ? `?${query}` : ""}`, { token });
}

export function getTask(token, id) {
  return request(`/tasks/${id}`, { token });
}

export function createTask(token, data) {
  return request("/tasks", { method: "POST", body: data, token });
}

export function updateTask(token, id, data) {
  return request(`/tasks/${id}`, { method: "PATCH", body: data, token });
}

export function deleteTask(token, id) {
  return request(`/tasks/${id}`, { method: "DELETE", token });
}

export function assignTask(token, id, assignedTo) {
  return request(`/tasks/${id}/assign`, { method: "PATCH", body: { assignedTo }, token });
}

export function setTaskStatus(token, id, status) {
  return request(`/tasks/${id}/status`, { method: "PATCH", body: { status }, token });
}

export function listComments(token, taskId) {
  return request(`/tasks/${taskId}/comments`, { token });
}

export function createComment(token, taskId, content) {
  return request(`/tasks/${taskId}/comments`, { method: "POST", body: { content }, token });
}

export function listUsers(token) {
  return request("/users", { token });
}

export function createUser(token, data) {
  return request("/users", { method: "POST", body: data, token });
}

export function updateUser(token, id, data) {
  return request(`/users/${id}`, { method: "PATCH", body: data, token });
}

export function deleteUser(token, id) {
  return request(`/users/${id}`, { method: "DELETE", token });
}

export function listActivity(token) {
  return request("/activity", { token });
}

export function assignedToMe(token) {
  return request("/dashboard/assigned-to-me", { token });
}

export function overdueTasks(token) {
  return request("/dashboard/overdue", { token });
}

export function completedTasks(token) {
  return request("/dashboard/completed", { token });
}

export { request };
