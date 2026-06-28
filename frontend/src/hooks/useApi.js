import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import * as api from "../lib/api";

export function useApi() {
  const { token } = useAuth();

  return useMemo(
    () => ({
      listTasks: (params) => api.listTasks(token, params),
      getTask: (id) => api.getTask(token, id),
      createTask: (data) => api.createTask(token, data),
      updateTask: (id, data) => api.updateTask(token, id, data),
      deleteTask: (id) => api.deleteTask(token, id),
      assignTask: (id, assignedTo) => api.assignTask(token, id, assignedTo),
      setTaskStatus: (id, status) => api.setTaskStatus(token, id, status),
      listComments: (taskId) => api.listComments(token, taskId),
      createComment: (taskId, content) => api.createComment(token, taskId, content),
      listUsers: () => api.listUsers(token),
      createUser: (data) => api.createUser(token, data),
      updateUser: (id, data) => api.updateUser(token, id, data),
      deleteUser: (id) => api.deleteUser(token, id),
      listActivity: () => api.listActivity(token),
      assignedToMe: () => api.assignedToMe(token),
      overdueTasks: () => api.overdueTasks(token),
      completedTasks: () => api.completedTasks(token),
    }),
    [token]
  );
}
