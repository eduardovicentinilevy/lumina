import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Contas from "./pages/dashboard/Contas";
import FluxoCaixa from "./pages/dashboard/FluxoCaixa";
import Credito from "./pages/dashboard/Credito";
import Cobranca from "./pages/dashboard/Cobranca";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="contas" element={<Contas />} />
          <Route path="fluxo-caixa" element={<FluxoCaixa />} />
          <Route path="credito" element={<Credito />} />
          <Route path="cobranca" element={<Cobranca />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
