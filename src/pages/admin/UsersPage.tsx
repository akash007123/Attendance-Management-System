import React, { useState, useMemo } from "react";
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation } from "../../store/api/baseApi";
import { useAppDispatch } from "../../store/hooks";
import { addToast } from "../../store/slices/uiSlice";
import { Modal } from "../../components/common/Modal";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { User, UserRole } from "../../types/user";
import { formatDate } from "../../utils/date";
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Briefcase,
  Loader2,
} from "lucide-react";

export const UsersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: users = [], isLoading } = useGetUsersQuery();
  const [createUserMutation, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUserMutation, { isLoading: isUpdating }] = useUpdateUserMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  // User form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "EMPLOYEE" as UserRole,
    department: "Engineering",
    designation: "Software Engineer",
    isActive: true,
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRole !== "ALL" && u.role !== selectedRole) return false;
      if (selectedDept !== "ALL" && u.department !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesDesignation = u.designation.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDesignation) return false;
      }
      return true;
    });
  }, [users, selectedRole, selectedDept, searchQuery]);

  const openAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "EMPLOYEE",
      department: "Engineering",
      designation: "Software Engineer",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
      department: u.department,
      designation: u.designation,
      isActive: u.isActive ?? u.status === "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (u: User) => {
    const currentActive = u.isActive ?? u.status === "ACTIVE";
    try {
      await updateUserMutation({
        id: u.id,
        user: {
          isActive: !currentActive,
          status: !currentActive ? "ACTIVE" : "INACTIVE",
        },
      }).unwrap();
      dispatch(
        addToast({
          type: "success",
          message: `User ${u.name} is now ${!currentActive ? "Active" : "Inactive"}.`,
        })
      );
    } catch (err) {
      dispatch(addToast({ type: "error", message: "Failed to update user status." }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUserMutation({
          id: editingUser.id,
          user: formData,
        }).unwrap();
        dispatch(addToast({ type: "success", message: `Updated user ${formData.name}` }));
      } else {
        await createUserMutation({
          ...formData,
          password: "Password@123", // standard initial password
        }).unwrap();
        dispatch(addToast({ type: "success", message: `Created new user ${formData.name}` }));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      dispatch(addToast({ type: "error", message: err.data?.message || "Failed to save user." }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add User */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            User Management Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization employees, role permissions (Employee, Manager, Admin), and department allocations
          </p>
        </div>

        <button
          type="button"
          onClick={openAddUser}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="No users match your criteria."
            actionLabel="Add New User"
            onAction={openAddUser}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department & Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {u.phone || "--"}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge type="role" status={u.role} size="sm" />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {u.department}
                      </span>
                      <span className="text-[11px] text-slate-400 block">{u.designation}</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => openEditUser(u)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit ${editingUser.name}` : "Create New User Profile"}
        subtitle="Manage employee attributes, system privileges, and department"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow transition-colors"
            >
              {isCreating || isUpdating ? "Saving..." : editingUser ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
