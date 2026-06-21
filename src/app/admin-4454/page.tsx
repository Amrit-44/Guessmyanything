import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminPanelClient } from "./admin-panel-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "admin_session";
const SESSION_TOKEN = "gma-admin-" + Buffer.from("Admin-Amrit:AMRIT-4454-ADMIN").toString("base64");

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  // If no valid session, show login form (client component handles this)
  const isAuthenticated = session?.value === SESSION_TOKEN;

  return <AdminPanelClient authenticated={isAuthenticated} />;
}
