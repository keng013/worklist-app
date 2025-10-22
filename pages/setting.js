import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
//import Layout from "../components/Layout";

export default function SettingPage({ user }) {
  const handleLogout = async () => {
    await fetch("/api/logout");
    window.location.href = "/login";
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p>System configuration options will appear here.</p>
    </>

    //</Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  const session = await getIronSession(req, res, sessionOptions);
  const user = session.user;
  if (!user || !user.isLoggedIn) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { user } };
}
