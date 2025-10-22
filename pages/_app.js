import "../styles/globals.css";
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import axios from "axios";
import { useState } from "react";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const user = pageProps.user;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post("/api/logout");
      router.push("/login");
    } catch (error) {
      // 👈 [แก้ไข] เพิ่มปีกกา {
      console.error("Failed to logout", error);
    } // 👈 [แก้ไข] เพิ่มปีกกา }
  };

  if (router.pathname === "/login") {
    return <Component {...pageProps} />;
  }

  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    >
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
