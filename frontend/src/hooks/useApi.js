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
      assignTask: (id, assigneeIds) => api.assignTask(token, id, assigneeIds),
      setTaskStatus: (id, status) => api.setTaskStatus(token, id, status),
      startTask: (id) => api.startTask(token, id),
      submitTaskForReview: (id, completionLink, completionNote) =>
        api.submitTaskForReview(token, id, completionLink, completionNote),
      approveTask: (id) => api.approveTask(token, id),
      rejectTask: (id, note) => api.rejectTask(token, id, note),
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
      listMessages: () => api.listMessages(token),
      createMessage: (content) => api.createMessage(token, content),
    }),
    [token]
  );
}
