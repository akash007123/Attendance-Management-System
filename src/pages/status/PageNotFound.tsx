import React from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Home } from "lucide-react";

export const PageNotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        404 • Page Not Found
      </span>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 mb-2">
        Page Does Not Exist
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        The route you navigated to could not be found or may have been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow transition-colors"
      >
        <Home className="w-4 h-4" /> Back to Application
      </Link>
    </div>
  );
};
