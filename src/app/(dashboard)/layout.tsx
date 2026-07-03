import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <DashboardShell
      userName={session.user.name ?? "Admin"}
      userEmail={session.user.email ?? ""}
      logoutAction={logout}
    >
      {children}
    </DashboardShell>
  );
}
