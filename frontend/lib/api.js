const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Common response handler — errors throw in consistent format
async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    // backend sends { success, message, errors }
    throw { message: data.message || "Something went wrong", errors: data.errors || [] };
  }
  return data;
}

// GET all tasks — search, filter, sort, pagination
export async function getTasks({
                                 skip = 0,
                                 limit = 10,
                                 search = "",
                                 statusFilter = "",
                                 priorityFilter = "",
                                 dueDateFrom = "",
                                 dueDateTo = "",
                                 hoursMin = "",
                                 hoursMax = "",
                                 sortBy = "created_at",
                                 order = "desc",
                                 starredOnly = false,
                               } = {}) {
  const params = new URLSearchParams();
  params.append("skip", skip);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (statusFilter) params.append("status_filter", statusFilter);
  if (priorityFilter) params.append("priority_filter", priorityFilter);
  if (dueDateFrom) params.append("due_date_from", dueDateFrom);
  if (dueDateTo) params.append("due_date_to", dueDateTo);
  if (hoursMin) params.append("hours_min", hoursMin);
  if (hoursMax) params.append("hours_max", hoursMax);
  if (sortBy) params.append("sort_by", sortBy);
  if (order) params.append("order", order);
  if (starredOnly) params.append("is_starred", "true");

  const res = await fetch(`${BASE_URL}/api/v1/tasks/?${params.toString()}`);
  return handleResponse(res);
}
// GET single task
export async function getTaskById(id) {
  const res = await fetch(`${BASE_URL}/api/v1/tasks/${id}`);
  return handleResponse(res);
}

// CREATE task
export async function createTask(taskData) {
  const res = await fetch(`${BASE_URL}/api/v1/tasks/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  });
  return handleResponse(res);
}

// UPDATE task
export async function updateTask(id, taskData) {
  const res = await fetch(`${BASE_URL}/api/v1/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  });
  return handleResponse(res);
}

// DELETE (soft delete) task
export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/api/v1/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw { message: data.message || "Delete failed", errors: data.errors || [] };
  }
  return true;
}

// CHANGE status
export async function changeTaskStatus(id, newStatus) {
  const res = await fetch(`${BASE_URL}/api/v1/tasks/${id}/status?new_status=${encodeURIComponent(newStatus)}`, {
    method: "PATCH",
  });
  return handleResponse(res);
}

// CHANGE priority
export async function changeTaskPriority(id, newPriority) {
  const res = await fetch(`${BASE_URL}/api/v1/tasks/${id}/priority?new_priority=${encodeURIComponent(newPriority)}`, {
    method: "PATCH",
  });
  return handleResponse(res);
}

// GET task stats — status counts + overdue
export async function getTaskStats() {
  const res = await fetch(`${BASE_URL}/api/v1/tasks/stats`);
  return handleResponse(res);
}

// TOGGLE star/pin
export async function toggleTaskStar(id) {
  const res = await fetch(`${BASE_URL}/api/v1/tasks/${id}/star`, {
    method: "PATCH",
  });
  return handleResponse(res);
}