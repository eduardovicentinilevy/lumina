import { redirect } from "next/navigation";
import { getCurrentCompany } from "@/lib/session";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentCompany();

  if (!session) {
    redirect("/login");
  }

  const { company, user } = session;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar companyName={company.name} userName={user.name} plan={company.plan} />
        <main className="flex-1 bg-background px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
