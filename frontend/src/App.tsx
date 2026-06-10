import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import { Link, Route, Routes } from "react-router-dom";
import CameraDetailPage from "./pages/CameraDetailPage";
import CameraListPage from "./pages/CameraListPage";

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
            sx={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}
          >
            相机保养管理
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<CameraListPage />} />
          <Route path="/cameras/:id" element={<CameraDetailPage />} />
        </Routes>
      </Container>
    </Box>
  );
}
