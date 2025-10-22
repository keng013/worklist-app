import React, { useState, useEffect } from "react";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import {
  User,
  Database,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  KeyRound,
} from "lucide-react"; // 👈 [ใหม่]
import Input from "../components/ui/Input";
import { apiClient } from "../lib/apiConfig";
import UserModal from "../components/ui/UserModal";

// ----- Reusable Tab Button -----
const TabButton = ({ title, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
      ${
        active
          ? "bg-white/50 text-blue-700 font-semibold shadow-md"
          : "text-gray-600 hover:bg-white/30"
      }
    `}
  >
    {icon}
    <span>{title}</span>
  </button>
);

// ----- Settings Page Component -----
export default function SettingsPage({ user }) {
  // 👈 รับ user prop จาก GSSP

  // 👈 [ใหม่] เปลี่ยน Tab เริ่มต้นเป็น 'resetPassword'
  const [activeTab, setActiveTab] = useState("resetPassword");
  const [users, setUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);

  // State สำหรับ Database Settings
  const [dbSettings, setDbSettings] = useState({
    db_host: "",
    db_port: "",
    db_name: "",
    db_user: "",
    db_pass: "",
  });
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);

  // State สำหรับ User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // 👈 [ใหม่] State สำหรับ Reset Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordResetResult, setPasswordResetResult] = useState(null);

  // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้จาก API
  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await apiClient.get("/api/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      if (err.response?.status === 403) {
        alert("You do not have permission to view users.");
      }
    } finally {
      setIsUsersLoading(false);
    }
  };

  // โหลด DB Settings หรือ Users
  useEffect(() => {
    // เคลียร์ผลลัพธ์เก่าๆ เมื่อเปลี่ยนแท็บ
    setPasswordResetResult(null);
    setTestResult(null);

    if (activeTab === "database") {
      if (user.role === "Admin") {
        setIsDbLoading(true);
        apiClient
          .get("/api/load-db-settings")
          .then((res) => {
            setDbSettings(res.data);
          })
          .catch((err) => console.error("Failed to load DB settings", err))
          .finally(() => setIsDbLoading(false));
      }
    } else if (activeTab === "users") {
      if (user.role === "Admin") {
        fetchUsers();
      }
    } else if (activeTab === "resetPassword") {
      // เคลียร์ฟอร์มรหัสผ่าน
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [activeTab, user.role]);

  // DB Settings handlers
  const handleDbChange = (e) => {
    const { name, value } = e.target;
    setDbSettings((prev) => ({ ...prev, [name]: value }));
  };
  const handleTestConnection = async () => {
    setTestResult({ testing: true, message: "Testing..." });
    try {
      const res = await apiClient.post("/api/test-db-connection", dbSettings);
      setTestResult({ success: true, message: res.data.message });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || "Connection failed",
      });
    }
  };
  const handleSaveDbSettings = async (e) => {
    e.preventDefault();
    setTestResult({ testing: true, message: "Saving..." });
    try {
      const res = await apiClient.post("/api/save-db-settings", dbSettings);
      setTestResult({ success: true, message: res.data.message });
      setDbSettings((prev) => ({ ...prev, db_pass: "" }));
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || "Failed to save",
      });
    }
  };

  // ----- User Management Handlers (เหมือนเดิม) -----
  const handleAddUserClick = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };
  const handleEditUserClick = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  const handleDeleteUserClick = async (userId, username) => {
    const confirmation = prompt(`Type "${username}" to confirm deletion:`);
    if (confirmation === username) {
      try {
        await apiClient.delete(`/api/users?id=${userId}`);
        fetchUsers();
      } catch (err) {
        alert("Failed to delete user: " + err.response?.data?.message);
      }
    }
  };
  const handleModalSubmit = async (formData) => {
    try {
      if (editingUser) {
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.password) {
          delete dataToUpdate.password;
        }
        await apiClient.put(
          `/api/users?id=${editingUser.user_id}`,
          dataToUpdate
        );
      } else {
        await apiClient.post("/api/users", formData);
      }
      fetchUsers();
    } catch (err) {
      console.error("Submit error:", err.response?.data?.message);
      throw new Error(err.response?.data?.message || "Failed to save user.");
    }
  };

  // 👈 [ใหม่] Handlers สำหรับ Reset Password
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordResetResult(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordResetResult({
        success: false,
        message: "New passwords do not match.",
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordResetResult({
        success: false,
        message: "New password must be at least 6 characters.",
      });
      return;
    }

    setPasswordResetResult({ testing: true, message: "Updating..." });
    try {
      const res = await apiClient.post("/api/reset-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordResetResult({ success: true, message: res.data.message });
      // เคลียร์ฟอร์ม
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordResetResult({
        success: false,
        message: err.response?.data?.message || "Failed to reset password.",
      });
    }
  };
  // ---------------------------------------------

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Settings
      </h1>

      {/* ----- Tab Navigation ----- */}
      <div className="flex space-x-2 bg-white/60 backdrop-blur-lg border border-white/30 p-2 rounded-xl shadow-lg mb-6 w-full md:w-auto md:max-w-lg">
        {/* 👈 [ใหม่] แท็บ Reset Password (เห็นทุกคน) */}
        <TabButton
          title="Reset Password"
          icon={<KeyRound size={18} />}
          active={activeTab === "resetPassword"}
          onClick={() => setActiveTab("resetPassword")}
        />

        {/* 👈 ซ่อนแท็บนี้ ถ้าไม่ใช่ Admin */}
        {user.role === "Admin" && (
          <TabButton
            title="User Management"
            icon={<User size={18} />}
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
        )}

        {/* 👈 [ใหม่] ซ่อนแท็บนี้ ถ้าไม่ใช่ Admin */}
        {user.role === "Admin" && (
          <TabButton
            title="Database Settings"
            icon={<Database size={18} />}
            active={activeTab === "database"}
            onClick={() => setActiveTab("database")}
          />
        )}
      </div>

      {/* ----- Content Area ----- */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-lg p-6 min-h-[500px]">
        {/* 👈 [ใหม่] เนื้อหา Reset Password */}
        {activeTab === "resetPassword" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Reset Your Password
            </h2>
            <form
              onSubmit={handleResetPasswordSubmit}
              className="space-y-4 max-w-md"
            >
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />

              <div className="flex flex-col items-start gap-4 pt-4">
                {/* 👈 [ใหม่] แสดงผลลัพธ์ */}
                {passwordResetResult && (
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg text-sm w-full
                    ${
                      passwordResetResult.testing
                        ? "text-gray-700"
                        : passwordResetResult.success
                        ? "bg-green-100/50 text-green-800"
                        : "bg-red-100/50 text-red-800"
                    }`}
                  >
                    {passwordResetResult.testing ? (
                      <Database size={18} className="animate-spin" />
                    ) : passwordResetResult.success ? (
                      <CheckCircle size={18} />
                    ) : (
                      <XCircle size={18} />
                    )}
                    <span>{passwordResetResult.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 👈 ซ่อนเนื้อหานี้ ถ้าไม่ใช่ Admin */}
        {activeTab === "users" && user.role === "Admin" && (
          <div>
            {/* ... (เนื้อหา User Management เหมือนเดิม) ... */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Manage Users
              </h2>
              <button
                onClick={handleAddUserClick}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow transition"
              >
                <UserPlus size={18} />
                <span>Add New User</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50/80 dark:bg-gray-700/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-10">
                        Loading users...
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.user_id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                          {user.full_name}
                        </td>
                        <td className="px-6 py-4 text-sm dark:text-gray-200 whitespace-nowrap">
                          {user.role}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <button
                            onClick={() => handleEditUserClick(user)}
                            className="text-blue-600 hover:text-blue-800 mr-4"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteUserClick(user.user_id, user.username)
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 👈 [ใหม่] ซ่อนเนื้อหานี้ ถ้าไม่ใช่ Admin */}
        {activeTab === "database" && user.role === "Admin" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Database Connection
            </h2>
            <div className="bg-yellow-100/50 border border-yellow-300 text-yellow-800 p-3 rounded-lg mb-4 text-sm">
              <strong>Warning:</strong> Changing these settings can break the
              application. These values are typically set in environment
              variables (.env) on the server.
            </div>

            {isDbLoading ? (
              <p>Loading settings...</p>
            ) : (
              <form
                onSubmit={handleSaveDbSettings}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <Input
                  label="Host"
                  name="db_host"
                  value={dbSettings.db_host}
                  onChange={handleDbChange}
                />
                <Input
                  label="Port"
                  name="db_port"
                  value={dbSettings.db_port}
                  onChange={handleDbChange}
                />
                <Input
                  label="Database Name"
                  name="db_name"
                  value={dbSettings.db_name}
                  onChange={handleDbChange}
                />
                <Input
                  label="Username"
                  name="db_user"
                  value={dbSettings.db_user}
                  onChange={handleDbChange}
                />
                <Input
                  label="Password"
                  name="db_pass"
                  type="password"
                  value={dbSettings.db_pass}
                  onChange={handleDbChange}
                  placeholder="(Leave blank to keep current) / Encrypted"
                />

                <div className="md:col-span-2 flex flex-col items-end gap-4 mt-4">
                  {testResult && (
                    <div
                      className={`flex items-center space-x-2 p-3 rounded-lg text-sm
                    ${
                      testResult.testing
                        ? "text-gray-700"
                        : testResult.success
                        ? "bg-green-100/50 text-green-800"
                        : "bg-red-100/50 text-red-800"
                    }`}
                    >
                      {testResult.testing ? (
                        <Database size={18} className="animate-spin" />
                      ) : testResult.success ? (
                        <CheckCircle size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md shadow transition"
                    >
                      Test Connection
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow transition"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Render Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingUser}
      />
    </>
  );
}

// GSSP นี้ใช้สำหรับตรวจสอบสิทธิ์ (Auth) เท่านั้น
export async function getServerSideProps({ req, res }) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;
  if (!user || !user.isLoggedIn) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { user } }; // 👈 ส่ง user (ที่มี role) ไปให้ Page
}
