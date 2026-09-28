import { Outlet } from "react-router-dom";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { Topbar } from "../../components/dashboard/Topbar";

export default function DashboardLayout() {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <main className="dashboard-content">
          <div className="dashboard-content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
