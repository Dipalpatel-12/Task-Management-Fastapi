"use client";

import { Pencil, Trash2 } from "lucide-react";

const STATUS_OPTIONS = ["To Do", "In Progress", "Completed", "Cancelled"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

const STATUS_STYLES = {
  "To Do": "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  "Completed": "bg-green-50 text-green-700 border-green-200",
  "Cancelled": "bg-red-50 text-red-700 border-red-200",
};

const PRIORITY_STYLES = {
  "Low": "bg-slate-100 text-slate-700 border-slate-200",
  "Medium": "bg-amber-50 text-amber-700 border-amber-200",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Urgent": "bg-red-50 text-red-700 border-red-200",
};

function SortHeader({ label, column, sortBy, order, onSort, width }) {
  const isActive = sortBy === column;
  return (
    <th
      onClick={() => onSort(column)}
      style={{ width }}
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none hover:bg-slate-100 transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && <span className="text-indigo-600">{order === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );
}

export default function TaskTable({
  tasks,
  loading,
  sortBy,
  order,
  onSort,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  page,
  limit,
}) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Loading tasks...
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        No tasks found.
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col style={{ width: "5%" }} /> 
          <col style={{ width: "22%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
          <tr>
             <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500">S.No</th>
            <SortHeader label="Title" column="title" sortBy={sortBy} order={order} onSort={onSort} />
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Priority</th>
            <SortHeader label="Due Date" column="due_date" sortBy={sortBy} order={order} onSort={onSort} />
            <SortHeader label="Hours" column="estimated_hours" sortBy={sortBy} order={order} onSort={onSort} />
            <SortHeader label="Created" column="created_at" sortBy={sortBy} order={order} onSort={onSort} />
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
             <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
    <td className="px-4 py-4 text-sm text-slate-500">
      {(page - 1) * limit + index + 1}
    </td>
              <td className="px-4 py-3 text-sm font-medium text-slate-900 truncate">{task.title}</td>
              <td className="px-4 py-3">
                <select
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value)}
                  className={`text-xs font-medium border rounded-md px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${STATUS_STYLES[task.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 ">
                <select
                  value={task.priority}
                  onChange={(e) => onPriorityChange(task.id, e.target.value)}
                  className={`text-xs font-medium border rounded-md px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${PRIORITY_STYLES[task.priority] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{task.estimated_hours}</td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {task.created_at ? new Date(task.created_at).toLocaleDateString() : "—"}
              </td>
             <td className="px-4 py-4">
  <div className="flex gap-2">
    <button
      onClick={() => onEdit(task)}
      className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
      title="Edit"
    >
      <Pencil size={16} />
    </button>
    <button
      onClick={() => onDelete(task)}
      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
      title="Delete"
    >
      <Trash2 size={16} />
    </button>
  </div>
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}