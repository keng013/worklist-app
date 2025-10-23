import NavMenu from "./NavMenu";
// 👈 [เพิ่ม] import icon สำหรับปุ่ม Hamburger (เมนูมือถือ)
import { Menu } from "lucide-react";

export default function Layout({
  user,
  children,
  onLogout,
  isCollapsed,
  setIsCollapsed,
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-300">
      {" "}
      {/* NavMenu (Sidebar) 
        [แก้] เพิ่ม 'hidden md:flex' เพื่อซ่อนในจอมือถือ 
      */}
      <NavMenu
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        className="hidden md:flex" // 👈 เพิ่มคลาสนี้เพื่อซ่อนในจอมือถือ
      />
      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out 
          ml-0 ${/* 👈 [แก้] มือถือ ml-0 เสมอ */ ""}
          ${isCollapsed ? "md:ml-[7rem]" : "md:ml-[18rem]"} ${
          /* 👈 [แก้] ใช้ md: นำหน้า */ ""
        }
        `}
      >
        {/* [เพิ่ม] Mobile Header (แสดงเฉพาะจอมือถือ)
         */}
        <header
          // ⚠️ [แก้ไข] เปลี่ยน "..." เป็น {`...`} (backticks)
          className={`
            md:hidden 
            bg-white/20 backdrop-blur-lg 
            shadow-md rounded-b-xl
            px-4 py-3 flex justify-between items-center z-40
          `}
        >
          {/* (Note: ปุ่มนี้ยังไม่ได้ใส่ฟังก์ชันเปิด-ปิด sidebar แบบ mobile) */}
          <button className="text-blue-950 p-1 rounded-md hover:bg-white/30">
            <Menu size={24} />
          </button>

          <h2 className="text-lg font-semibold text-blue-950">
            {user?.username || "User"}
          </h2>

          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md font-bold text-sm"
          >
            Logout
          </button>
        </header>

        {/* [แก้] Desktop Header (ซ่อนในจอมือถือ)
         */}
        <header
          // ⚠️ [แก้ไข] เปลี่ยน "..." เป็น {`...`} (backticks)
          className={`
            hidden md:flex
            bg-white/20 backdrop-blur-lg 
            shadow-md rounded-b-xl
            px-6 py-4 
            flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 
            z-40
          `}
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

        {/* [แก้] Page Content (ลด padding ในจอมือถือ)
         */}
        <main className="flex-1 p-4 md:p-6">{children}</main>

        {/* Footer */}
        <footer
          // ⚠️ [แก้ไข] เปลี่ยน "..." เป็น {`...`} (backticks)
          className={`
            bg-white/20 backdrop-blur-md 
            text-center py-4 text-sm text-blue-950/70 
            shadow-inner rounded-t-xl
          `}
        >
          © 2025 MD Healthcare. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
