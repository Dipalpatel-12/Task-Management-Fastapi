"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, Star, ChevronRight, ChevronDown, X } from "lucide-react";

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

const STATUS_DOT = {
    "To Do": "bg-slate-400",
    "In Progress": "bg-blue-500",
    "Completed": "bg-green-500",
    "Cancelled": "bg-red-500",
};

const PRIORITY_DOT = {
    "Low": "bg-slate-400",
    "Medium": "bg-amber-500",
    "High": "bg-orange-500",
    "Urgent": "bg-red-500",
};

/**
 * Custom dropdown — replaces native <select> so styling stays
 * consistent everywhere and the menu never gets visually detached
 * from its row (renders via portal, positioned against the trigger,
 * flips upward automatically if there isn't room below).
 */
function Dropdown({ value, options, styleMap, dotMap, onChange, fullWidth = false }) {
    const [open, setOpen] = useState(false);
    const [menuPos, setMenuPos] = useState(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    const openMenu = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        const menuHeight = options.length * 34 + 8;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;

        setMenuPos({
            left: rect.left,
            width: fullWidth ? rect.width : Math.max(rect.width, 128),
            top: openUpward ? undefined : rect.bottom + 4,
            bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
        });
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;

        const handleOutside = (e) => {
            if (
                triggerRef.current?.contains(e.target) ||
                menuRef.current?.contains(e.target)
            ) {
                return;
            }
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
                className={`${fullWidth ? "w-full" : ""} inline-flex items-center justify-between gap-1.5 text-xs font-medium border rounded-md px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    styleMap[value] || "bg-slate-100 text-slate-700 border-slate-200"
                }`}
            >
                <span className="inline-flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotMap[value] || "bg-slate-400"}`} />
                    {value}
                </span>
                <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
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
                        {options.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                    onChange(opt);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors ${
                                    opt === value ? "bg-slate-50" : ""
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${dotMap[opt] || "bg-slate-400"}`} />
                                {opt}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
        </>
    );
}

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

function isOverdue(task) {
    if (!task.due_date) return false;
    if (task.status === "Completed" || task.status === "Cancelled") return false;
    return new Date(task.due_date) < new Date();
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
                                      onToggleStar,
                                      page,
                                      limit,
                                  }) {
    const [selectedTask, setSelectedTask] = useState(null);

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
        <>
            {/* Desktop table — unchanged */}
            <div className="hidden lg:block flex-1 min-h-0 overflow-y-auto">
                <table className="w-full table-fixed border-collapse">
                    <colgroup>
                        <col style={{ width: "3%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "11%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "10%" }} />
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
                    {tasks.map((task, index) => {
                        const overdue = isOverdue(task);
                        return (
                            <tr
                                key={task.id}
                                className={`border-b transition-colors ${
                                    overdue
                                        ? "bg-red-50/60 border-red-100 hover:bg-red-50"
                                        : "border-slate-100 hover:bg-slate-50"
                                }`}
                            >
                                <td className="px-4 py-4 text-sm text-slate-500 align-top">
                                    {(page - 1) * limit + index + 1}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {task.title}
                        </span>
                                        {overdue && (
                                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-red-600 bg-red-100 border border-red-200 rounded px-1.5 py-0.5">
                              Overdue
                            </span>
                                        )}
                                    </div>
                                    {task.description && (
                                        <p
                                            className="text-xs text-slate-400 truncate mt-0.5"
                                            title={task.description}
                                        >
                                            {task.description}
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <Dropdown
                                        value={task.status}
                                        options={STATUS_OPTIONS}
                                        styleMap={STATUS_STYLES}
                                        dotMap={STATUS_DOT}
                                        onChange={(val) => onStatusChange(task.id, val)}
                                    />
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <Dropdown
                                        value={task.priority}
                                        options={PRIORITY_OPTIONS}
                                        styleMap={PRIORITY_STYLES}
                                        dotMap={PRIORITY_DOT}
                                        onChange={(val) => onPriorityChange(task.id, val)}
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 align-top">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 align-top">{task.estimated_hours}</td>
                                <td className="px-4 py-3 text-sm text-slate-600 align-top">
                                    {task.created_at ? new Date(task.created_at).toLocaleDateString() : "—"}
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onToggleStar(task)}
                                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                                task.is_starred
                                                    ? "text-amber-500 hover:bg-amber-50"
                                                    : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"
                                            }`}
                                            title={task.is_starred ? "Unpin" : "Pin"}
                                        >
                                            <Star size={16} fill={task.is_starred ? "currentColor" : "none"} />
                                        </button>
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
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Mobile / Tablet — compact card list */}
            <div className="lg:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
                {tasks.map((task, index) => {
                    const overdue = isOverdue(task);
                    return (
                        <button
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className={`w-full text-left px-4 py-3.5 flex items-center gap-5 transition-colors cursor-pointer ${
                                overdue ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-slate-50"
                            }`}
                        >
        <span className="shrink-0 text-xs text-slate-400 font-medium w-5 text-center">
          {(page - 1) * limit + index + 1}
        </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {task.title}
                      </span>
                                    {overdue && (
                                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-red-600 bg-red-100 border border-red-200 rounded px-1.5 py-0.5">
                            Overdue
                          </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-[11px] font-medium border rounded-md px-1.5 py-0.5 ${STATUS_STYLES[task.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                        {task.status}
                      </span>
                                    <span className={`text-[11px] font-medium border rounded-md px-1.5 py-0.5 ${PRIORITY_STYLES[task.priority] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                        {task.priority}
                      </span>
                                    {task.due_date && (
                                        <span className="text-[11px] text-slate-400">
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                                    )}
                                </div>
                            </div>
                            {task.is_starred && (
                                <Star size={15} className="text-amber-500 shrink-0" fill="currentColor" />
                            )}
                            <ChevronRight size={16} className="text-slate-300 shrink-0" />
                        </button>
                    );
                })}
            </div>

            {/* Detail popup — mobile & tablet */}
            {selectedTask && (
                <div
                    className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
                    onClick={() => setSelectedTask(null)}
                >
                    <div
                        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="min-w-0 pr-3">
                                <h3 className="text-base font-semibold text-slate-900 break-words">
                                    {selectedTask.title}
                                </h3>
                                {isOverdue(selectedTask) && (
                                    <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 bg-red-100 border border-red-200 rounded px-1.5 py-0.5">
                          Overdue
                        </span>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {selectedTask.description && (
                            <p className="text-sm text-slate-500 mb-4">{selectedTask.description}</p>
                        )}

                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</label>
                                <div className="mt-1">
                                    <Dropdown
                                        value={selectedTask.status}
                                        options={STATUS_OPTIONS}
                                        styleMap={STATUS_STYLES}
                                        dotMap={STATUS_DOT}
                                        fullWidth
                                        onChange={(val) => {
                                            onStatusChange(selectedTask.id, val);
                                            setSelectedTask({ ...selectedTask, status: val });
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Priority</label>
                                <div className="mt-1">
                                    <Dropdown
                                        value={selectedTask.priority}
                                        options={PRIORITY_OPTIONS}
                                        styleMap={PRIORITY_STYLES}
                                        dotMap={PRIORITY_DOT}
                                        fullWidth
                                        onChange={(val) => {
                                            onPriorityChange(selectedTask.id, val);
                                            setSelectedTask({ ...selectedTask, priority: val });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Due Date</label>
                                    <p className="text-sm text-slate-700 mt-1.5">
                                        {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : "—"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Hours</label>
                                    <p className="text-sm text-slate-700 mt-1.5">{selectedTask.estimated_hours ?? "—"}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Created</label>
                                <p className="text-sm text-slate-700 mt-1.5">
                                    {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleDateString() : "—"}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    onToggleStar(selectedTask);
                                    setSelectedTask({ ...selectedTask, is_starred: !selectedTask.is_starred });
                                }}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                                    selectedTask.is_starred
                                        ? "text-amber-500 border-amber-200 bg-amber-50"
                                        : "text-slate-500 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                <Star size={16} fill={selectedTask.is_starred ? "currentColor" : "none"} />
                                {selectedTask.is_starred ? "Unpin" : "Pin"}
                            </button>
                            <button
                                onClick={() => { onEdit(selectedTask); setSelectedTask(null); }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-indigo-200 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                                <Pencil size={16} /> Edit
                            </button>
                            <button
                                onClick={() => { onDelete(selectedTask); setSelectedTask(null); }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}