import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ShutterSpeedIcon from "@mui/icons-material/ShutterSpeed";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import { Link, Route, Routes } from "react-router-dom";
import CameraDetailPage from "./pages/CameraDetailPage";
import CameraListPage from "./pages/CameraListPage";
import ShutterCountPage from "./pages/ShutterCountPage";

export default function App() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <CameraAltIcon sx={{ mr: 1 }} />
          <Typography
            component={Link}
            to="/"
            variant="h6"
            sx={{ color: "inherit", textDecoration: "none", fontWeight: 600, mr: 3 }}
          >
            相机保养管理
          </Typography>
          <Typography
            component={Link}
            to="/shutter-counts"
            variant="body1"
            sx={{
              color: "inherit",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              opacity: 0.85,
              "&:hover": { opacity: 1 },
            }}
          >
            <ShutterSpeedIcon fontSize="small" />
            快门记录
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<CameraListPage />} />
          <Route path="/cameras/:id" element={<CameraDetailPage />} />
          <Route path="/shutter-counts" element={<ShutterCountPage />} />
        </Routes>
      </Container>
    </Box>
  );
}
