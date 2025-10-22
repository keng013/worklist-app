import Link from "next/link";
import { useRouter } from "next/router";
import {
  Home,
  Activity,
  ClipboardList,
  Settings,
  ChevronsLeft,
} from "lucide-react";

export default function NavMenu({ isCollapsed, setIsCollapsed }) {
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <Home size={18} /> },
    {
      name: "PACS Utilization",
      path: "/pacsutilization",
      icon: <Activity size={18} />,
    },
    {
      name: "Worklist Tools",
      path: "/worklist",
      icon: <ClipboardList size={18} />,
    },
    { name: "Setting", path: "/setting", icon: <Settings size={18} /> },
  ];

  return (
    <aside
      className={`
        fixed left-0 flex flex-col
        m-4 h-[calc(100vh-2rem)] p-4 
        rounded-2xl shadow-xl
        bg-white/20 
        backdrop-blur-lg 
        border border-white/30
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-64"} 
      `}
    >
      {/* Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-10 bg-white/50 hover:bg-white/80 backdrop-blur-md p-1 rounded-full text-blue-900 shadow-lg transition-all duration-300"
      >
        <ChevronsLeft
          size={18}
          className={`transition-transform duration-300 ${
            isCollapsed ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Header */}
      <h1 className="text-lg font-bold text-blue-950 mb-6 border-b border-white/30 pb-2 overflow-hidden whitespace-nowrap">
        {isCollapsed ? "PACS" : "PACS Admin Tools"}
      </h1>

      {/* Nav Items */}
      <nav className="flex flex-col space-y-2">
        {menuItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div
              className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-all ${
                router.pathname === item.path
                  ? "bg-white/40 text-blue-800 font-semibold"
                  : "text-blue-900/70 hover:bg-white/30 hover:text-blue-900"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              {item.icon}
              <span
                className={`transition-opacity duration-100 ${
                  isCollapsed ? "opacity-0 hidden" : "opacity-100 inline"
                }`}
              >
                {item.name}
              </span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Version Number (pushed to bottom) */}
      <div className="mt-auto pt-4 border-t border-white/30">
        <p
          className={`text-xs text-blue-950/60 transition-all ${
            isCollapsed ? "text-center" : "text-right"
          }`}
        >
          {isCollapsed ? "v1.0" : "Version 1.0.0"}
        </p>
      </div>
    </aside>
  );
}
