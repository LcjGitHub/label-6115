import CameraAltIcon from "@mui/icons-material/CameraAlt";
import BarChartIcon from "@mui/icons-material/BarChart";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import BuildIcon from "@mui/icons-material/Build";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import LensIcon from "@mui/icons-material/Lens";
import ShutterSpeedIcon from "@mui/icons-material/ShutterSpeed";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import CameraDetailPage from "./pages/CameraDetailPage";
import CameraListPage from "./pages/CameraListPage";
import CameraUsageLogPage from "./pages/CameraUsageLogPage";
import LensAccessoryPage from "./pages/LensAccessoryPage";
import MaintenancePlanPage from "./pages/MaintenancePlanPage";
import MaintenanceTypePage from "./pages/MaintenanceTypePage";
import OverviewPage from "./pages/OverviewPage";
import RepairServiceProviderPage from "./pages/RepairServiceProviderPage";
import ShutterCountPage from "./pages/ShutterCountPage";
import WarrantyPage from "./pages/WarrantyPage";

const navItems = [
  { label: "配件管理", to: "/lens-accessories", icon: <LensIcon fontSize="small" /> },
  { label: "快门记录", to: "/shutter-counts", icon: <ShutterSpeedIcon fontSize="small" /> },
  { label: "保养计划", to: "/maintenance-plans", icon: <EventRepeatIcon fontSize="small" /> },
  { label: "保养类型", to: "/maintenance-types", icon: <BuildIcon fontSize="small" /> },
  { label: "保修管理", to: "/warranty", icon: <VerifiedUserIcon fontSize="small" /> },
  { label: "维修服务商", to: "/repair-service-providers", icon: <BuildCircleIcon fontSize="small" /> },
  { label: "数据概览", to: "/overview", icon: <BarChartIcon fontSize="small" /> },
];

function isRouteActive(currentPath: string, targetPath: string): boolean {
  if (targetPath === "/") {
    return currentPath === "/";
  }
  return currentPath === targetPath || currentPath.startsWith(targetPath + "/");
}

export default function App() {
  const location = useLocation();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <CameraAltIcon sx={{ mr: 1 }} />
          <Typography
            component={Link}
            to="/"
            variant="h6"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: 600,
              mr: 3,
              borderBottom: isRouteActive(location.pathname, "/") ? 2 : 0,
              borderColor: "inherit",
              pb: isRouteActive(location.pathname, "/") ? "2px" : 0,
            }}
          >
            相机保养管理
          </Typography>
          {navItems.map((item) => {
            const active = isRouteActive(location.pathname, item.to);
            return (
              <Typography
                key={item.to}
                component={Link}
                to={item.to}
                variant="body1"
                sx={{
                  color: "inherit",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mr: 2,
                  fontWeight: active ? 700 : 400,
                  opacity: active ? 1 : 0.85,
                  borderBottom: active ? 2 : 0,
                  borderColor: "inherit",
                  pb: active ? "2px" : 0,
                  "&:hover": { opacity: 1 },
                }}
              >
                {item.icon}
                {item.label}
              </Typography>
            );
          })}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Routes key={location.pathname} location={location}>
          <Route path="/" element={<CameraListPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/cameras/:id" element={<CameraDetailPage />} />
          <Route path="/cameras/:id/usage-logs" element={<CameraUsageLogPage />} />
          <Route path="/lens-accessories" element={<LensAccessoryPage />} />
          <Route path="/shutter-counts" element={<ShutterCountPage />} />
          <Route path="/maintenance-plans" element={<MaintenancePlanPage />} />
          <Route path="/maintenance-types" element={<MaintenanceTypePage />} />
          <Route path="/warranty" element={<WarrantyPage />} />
          <Route path="/repair-service-providers" element={<RepairServiceProviderPage />} />
        </Routes>
      </Container>
    </Box>
  );
}
