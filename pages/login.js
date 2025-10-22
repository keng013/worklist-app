import { useState } from "react";
import { useRouter } from "next/router";

// Component สำหรับหน้า Login
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันที่จะทำงานเมื่อฟอร์มถูก submit
  const handleSubmit = async (e) => {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้าเว็บ
    setLoading(true);
    setError("");

    const form = e.target;
    const formData = new FormData(form);
    const formJson = Object.fromEntries(formData.entries());

    try {
      // ส่ง request ไปยัง API /api/login
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formJson),
      });

      const result = await response.json();

      if (response.ok) {
        // ถ้า login สำเร็จ, redirect ไปที่หน้าหลัก
        router.push("/");
      } else {
        // ถ้าไม่สำเร็จ, แสดงข้อความ error
        setError(result.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Container หลัก พร้อมพื้นหลังแบบ gradient สีน้ำเงิน
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center p-4">
      {/* การ์ด Glass Morphism */}
      <div className="w-full max-w-md bg-white/30 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white">RKH PACS Admin</h2>
          <p className="mt-2 text-white/80">
            Welcome back! Please sign in to continue.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* ช่องกรอก Username */}
          <div>
            <label
              htmlFor="username"
              className="text-sm font-semibold text-white"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:bg-white/30 focus:border-white focus:outline-none transition"
              placeholder="Enter your username"
            />
          </div>
          {/* ช่องกรอก Password */}
          <div>
            <label
              htmlFor="password"
              name="password"
              className="text-sm font-semibold text-white"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:bg-white/30 focus:border-white focus:outline-none transition"
              placeholder="Enter your password"
            />
          </div>

          {/* แสดงข้อความ Error (ถ้ามี) */}
          {error && (
            <p className="text-yellow-300 text-sm text-center bg-red-500/50 rounded-md p-2">
              {error}
            </p>
          )}

          {/* ปุ่ม Sign in */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
