import NavMenu from "./NavMenu";

// 👈 [แก้ไข] รับ props isCollapsed และ setIsCollapsed
export default function Layout({
  user,
  children,
  onLogout,
  isCollapsed,
  setIsCollapsed,
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-300">
      {/* 👈 [แก้ไข] ส่ง props ต่อไปให้ NavMenu */}
      <NavMenu isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div
        // 👈 [แก้ไข] ปรับ margin-left (ml) อัตโนมัติ
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "ml-[7rem]" : "ml-[18rem]" // w-64 (16rem) + m-4 (2rem) = 18rem.  w-20 (5rem) + m-4 (2rem) = 7rem.
        }`}
      >
        {/* Header (Glassmorphism) */}
        <header
          className="
            bg-white/20 backdrop-blur-lg 
            shadow-md rounded-b-xl
            px-6 py-4 flex justify-between items-center
          "
        >
          <h2 className="text-xl font-semibold text-blue-950">
            Welcome, {user?.username || "User"}
          </h2>
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-bold"
            >
              Logout
            </button>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>

        {/* Footer (Glassmorphism) */}
        <footer
          className="
            bg-white/20 backdrop-blur-md 
            text-center py-4 text-sm text-blue-950/70 
            shadow-inner rounded-t-xl
          "
        >
          © 2025 MD Healthcare. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
