"use client";

import { Trash2 } from "lucide-react";

export default function ConfirmDeleteModal({ taskTitle, onCancel, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-red-50 rounded-full">
            <Trash2 className="text-red-600" size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Delete Task</h2>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <span className="font-medium text-slate-900">{taskTitle}</span>? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 active:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {deleting ? "Deleting..." : "Delete Task"}
          </button>
        </div>
      </div>
    </div>
  );
}