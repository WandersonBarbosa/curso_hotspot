import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { FinancePage } from "@/pages/FinancePage";
import { HotspotPage } from "@/pages/HotspotPage";
import { LoginPage } from "@/pages/LoginPage";
import { useAuthStore } from "@/store/auth";

function RequireAuth() {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="hotspot" element={<HotspotPage />} />
          <Route path="financeiro" element={<FinancePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
