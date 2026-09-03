"use client";

import { useState, useEffect, useCallback } from "react";
import { getTasks, deleteTask, changeTaskStatus, changeTaskPriority } from "../lib/api";
import TaskTable from "../components/TaskTable";
import TaskFormModal from "../components/TaskFormModal";
import { Search, ChevronLeft, ChevronRight, Plus, Calendar, Clock, X } from "lucide-react";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import Toast from "@/components/Toast";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [hoursMin, setHoursMin] = useState("");
  const [hoursMax, setHoursMax] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

const [toast, setToast] = useState(null); 

  const hasActiveFilters =
    statusFilter || priorityFilter || dueDateFrom || dueDateTo || hoursMin || hoursMax;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const skip = (page - 1) * limit;
      const data = await getTasks({
        skip,
        limit,
        search,
        statusFilter,
        priorityFilter,
        dueDateFrom,
        dueDateTo,
        hoursMin,
        hoursMax,
        sortBy,
        order,
      });
      setTasks(data.items || data);
      setTotal(data.total ?? data.length);
    } catch (err) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, dueDateFrom, dueDateTo, hoursMin, hoursMax, sortBy, order, page]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setOrder("asc");
    }
  };

  const handleDeleteClick = (task) => {
    setDeleteTarget(task);
  };

const confirmDelete = async () => {
  if (!deleteTarget) return;
  setDeleting(true);
  try {
    await deleteTask(deleteTarget.id);
    setDeleteTarget(null);
    fetchTasks();
    setToast({ message: "Task deleted successfully", type: "success" });
  } catch (err) {
    setToast({ message: err.message || "Delete failed", type: "error" });
  } finally {
    setDeleting(false);
  }
};

const handleStatusChange = async (id, newStatus) => {
  try {
    await changeTaskStatus(id, newStatus);
    fetchTasks();
    setToast({ message: "Status updated successfully", type: "success" });
  } catch (err) {
    setToast({ message: err.message || "Status change failed", type: "error" });
  }
};

 const handlePriorityChange = async (id, newPriority) => {
  try {
    await changeTaskPriority(id, newPriority);
    fetchTasks();
    setToast({ message: "Priority updated successfully", type: "success" });
  } catch (err) {
    setToast({ message: err.message || "Priority change failed", type: "error" });
  }
};

  const openAddModal = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const onSaved = () => {
    closeModal();
    fetchTasks();
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setDueDateFrom("");
    setDueDateTo("");
    setHoursMin("");
    setHoursMax("");
    setPage(1);
  };

  return (
    <div className="h-screen flex flex-col px-8 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Task Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total tasks</p>
        </div>
        <button
          onClick={openAddModal}
          className="cursor-pointer flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by title or description..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="cursor-pointer border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="cursor-pointer border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Priority</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        <div className="w-px h-6 bg-slate-200" />

        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar size={15} />
          <input
            type="date"
            value={dueDateFrom}
            onChange={(e) => { setDueDateFrom(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Due date from"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={dueDateTo}
            onChange={(e) => { setDueDateTo(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Due date to"
          />
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock size={15} />
          <input
            type="number"
            step="0.5"
            min="0"
            placeholder="Min hrs"
            value={hoursMin}
            onChange={(e) => { setHoursMin(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-2.5 py-2 text-sm bg-white w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="number"
            step="0.5"
            min="0"
            placeholder="Max hrs"
            value={hoursMax}
            onChange={(e) => { setHoursMax(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-lg px-2.5 py-2 text-sm bg-white w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto cursor-pointer flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors px-2 py-1"
          >
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-3 shrink-0">{error}</p>}

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        <TaskTable
          tasks={tasks}
          loading={loading}
          sortBy={sortBy}
          order={order}
          onSort={handleSort}
          onEdit={openEditModal}
          onDelete={handleDeleteClick}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          page={page}
          limit={limit}
        />
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 shrink-0">
        <p className="text-sm text-slate-500">
          Page <span className="font-medium text-slate-700">{page}</span> of{" "}
          <span className="font-medium text-slate-700">{Math.max(1, Math.ceil(total / limit))}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-full text-sm font-medium text-slate-700 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-700 transition-colors"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-full text-sm font-medium text-slate-700 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-700 transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {showModal && <TaskFormModal task={editingTask} onClose={closeModal} onSaved={onSaved} />}

      {deleteTarget && (
        <ConfirmDeleteModal
          taskTitle={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          deleting={deleting}
        />
      )}

      {toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
    </div>
  );
}