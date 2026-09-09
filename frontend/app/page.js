"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { getTasks, deleteTask, changeTaskStatus, changeTaskPriority, toggleTaskStar } from "../lib/api";
import TaskTable from "../components/TaskTable";
import TaskFormModal from "../components/TaskFormModal";
import { Search, ChevronLeft, ChevronRight, ChevronDown, Plus, Calendar, Clock, X, Loader2, RefreshCw } from "lucide-react";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import Toast from "@/components/Toast";


function FilterDropdown({ value, options, placeholder, onChange }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const allOptions = [{ label: placeholder, value: "" }, ...options];
  const current = allOptions.find((o) => o.value === value) || allOptions[0];

  const openMenu = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = allOptions.length * 34 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuPos({
      left: rect.left,
      width: Math.max(rect.width, 160),
      top: openUpward ? undefined : rect.bottom + 4,
      bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const handleScrollOrResize = () => setOpen(false);

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  return (
      <>
        <button
            type="button"
            ref={triggerRef}
            onClick={() => (open ? setOpen(false) : openMenu())}
            className="cursor-pointer flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[130px]"
        >
          <span className={value ? "text-slate-900" : "text-slate-500"}>{current.label}</span>
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open &&
            menuPos &&
            createPortal(
                <div
                    ref={menuRef}
                    style={{
                      position: "fixed",
                      left: menuPos.left,
                      top: menuPos.top,
                      bottom: menuPos.bottom,
                      width: menuPos.width,
                    }}
                    className="z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 overflow-hidden"
                >
                  {allOptions.map((opt) => (
                      <button
                          key={opt.value || "all"}
                          type="button"
                          onClick={() => {
                            onChange(opt.value);
                            setOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${
                              opt.value === value ? "bg-slate-50 font-medium text-slate-900" : "text-slate-600"
                          }`}
                      >
                        {opt.label}
                      </button>
                  ))}
                </div>,
                document.body
            )}
      </>
  );
}

// How long to keep silently retrying before giving up and showing an error.
// Render's free tier can take 30-50s to spin back up from a cold start.
const RETRY_DELAYS_MS = [800, 1500, 2500, 4000, 6000, 8000, 10000, 10000]; // ~43s total

function isNetworkError(err) {
  // A cold/unreachable server surfaces as a raw fetch failure, not a JSON error body
  return err instanceof TypeError || err?.message === "Failed to fetch";
}

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wakingUp, setWakingUp] = useState(false);
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

  // Bumps whenever a newer fetch starts, so a slow retry from an older
  // call can't overwrite state after the user has moved on (e.g. changed filters).
  const requestIdRef = useRef(0);

  const hasActiveFilters =
      statusFilter || priorityFilter || dueDateFrom || dueDateTo || hoursMin || hoursMax;

  const fetchTasks = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setWakingUp(false);
    setError("");

    const params = {
      skip: (page - 1) * limit,
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
    };

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        const data = await getTasks(params);
        if (requestId !== requestIdRef.current) return; // a newer request superseded this one

        setTasks(data.items || data);
        setTotal(data.total ?? data.length);
        setLoading(false);
        setWakingUp(false);
        return;
      } catch (err) {
        if (requestId !== requestIdRef.current) return;

        const isLastAttempt = attempt === RETRY_DELAYS_MS.length;

        if (isNetworkError(err) && !isLastAttempt) {
          setWakingUp(true);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
          continue;
        }

        setError(
            isNetworkError(err)
                ? "The server is taking longer than usual to respond."
                : err.message || "Failed to load tasks"
        );
        setLoading(false);
        setWakingUp(false);
        return;
      }
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

  const handleToggleStar = async (task) => {
    try {
      await toggleTaskStar(task.id);
      fetchTasks();
      setToast({
        message: task.is_starred ? "Task unpinned" : "Task pinned",
        type: "success",
      });
    } catch (err) {
      setToast({ message: err.message || "Failed to update pin", type: "error" });
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
      <div className="h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-4 lg:py-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-semibold text-blue-950">Task Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} Total Tasks</p>
          </div>
          <button
              onClick={openAddModal}
              className="cursor-pointer flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-5 py-3.5 rounded-lg font-medium text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors w-full sm:w-auto"
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
          <FilterDropdown
              value={statusFilter}
              placeholder="All Status"
              options={[
                { label: "To Do", value: "To Do" },
                { label: "In Progress", value: "In Progress" },
                { label: "Completed", value: "Completed" },
                { label: "Cancelled", value: "Cancelled" },
              ]}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
          />

          <FilterDropdown
              value={priorityFilter}
              placeholder="All Priority"
              options={[
                { label: "Low", value: "Low" },
                { label: "Medium", value: "Medium" },
                { label: "High", value: "High" },
                { label: "Urgent", value: "Urgent" },
              ]}
              onChange={(val) => { setPriorityFilter(val); setPage(1); }}
          />

          <div className="w-px h-6 bg-slate-200" />

          <div className="flex items-center gap-1.5 text-slate-400 flex-wrap">
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

          <div className="flex items-center gap-1.5 text-slate-400 flex-wrap">
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

        {/* Table / Loading / Error */}
        <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="animate-spin text-indigo-500" size={28} />
                <p className="text-sm">
                  {wakingUp ? "Waking up the server — this can take up to a minute…" : "Loading tasks…"}
                </p>
              </div>
          ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500 px-6 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button
                    onClick={fetchTasks}
                    className="cursor-pointer flex items-center gap-1.5 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw size={14} /> Try again
                </button>
              </div>
          ) : (
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
                  onToggleStar={handleToggleStar}
                  page={page}
                  limit={limit}
              />
          )}
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