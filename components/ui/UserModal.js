import React, { useState, useEffect } from "react";
import Input from "./Input"; // 👈 Import Input
import Select from "./Select"; // 👈 Import Select

/**
 * Modal for Add/Edit User
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {function} props.onSubmit - Function to submit the form data
 * @param {object | null} props.initialData - User data for editing, or null for adding
 */
export default function UserModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    role: "User",
    password: "",
  });
  const [error, setError] = useState(null);

  // ตรวจสอบว่าเป็นการ "Edit" หรือ "Add"
  const isEditing = Boolean(initialData);

  // เมื่อ initialData เปลี่ยน (เช่น กดปุ่ม Edit)
  useEffect(() => {
    if (isEditing) {
      setFormData({
        username: initialData.username || "",
        full_name: initialData.full_name || "",
        role: initialData.role || "User",
        password: "", // ไม่ต้องโหลดรหัสผ่านเก่ามา
      });
    } else {
      // ถ้าเป็นการ Add, เคลียร์ฟอร์ม
      setFormData({ username: "", full_name: "", role: "User", password: "" });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit(formData);
      onClose(); // ปิด Modal เมื่อ Submit สำเร็จ
    } catch (err) {
      setError(err.message || "An error occurred.");
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop (พื้นหลังมืด)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-md p-6 m-4"
        onClick={(e) => e.stopPropagation()} // 👈 ป้องกันการคลิกใน Modal แล้วปิด
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {isEditing ? "Edit User" : "Add New User"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <Input
            label="Full Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
          {/* (Select component ของเราต้องรองรับ options ที่เป็น string array) */}
          <Select
            label="Role"
            name="role"
            options={["Admin", "User"]} // 👈 ระบุ Role ที่ต้องการ
            value={formData.role}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={isEditing ? "(Leave blank to keep unchanged)" : ""}
            required={!isEditing} // 👈 จำเป็นต้องกรอกถ้าเป็น Add
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md shadow transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow transition"
            >
              {isEditing ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
