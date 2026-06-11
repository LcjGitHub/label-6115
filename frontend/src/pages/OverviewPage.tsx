import CameraAltIcon from "@mui/icons-material/CameraAlt";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchStatisticsOverview } from "../api/client";

export default function OverviewPage() {
  const theme = useTheme();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["statistics"],
    queryFn: fetchStatisticsOverview,
  });

  const statCards = [
    {
      label: "相机总数",
      icon: <CameraAltIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
    },
    {
      label: "保养记录总数",
      icon: <BuildIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
    },
    {
      label: "预估快门数超过五万",
      icon: <WarningAmberIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
    },
  ];

  const statValues = [
    data?.totalCameras,
    data?.totalMaintenanceRecords,
    data?.highShutterCameras,
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        数据概览
      </Typography>

      {isError && <Alert severity="error" sx={{ mb: 3 }}>加载失败，请确认后端已启动</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 72,
                    height: 72,
                    borderRadius: 2,
                    bgcolor: card.bgColor,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                  {isLoading || statValues[index] === undefined ? (
                    <Skeleton variant="text" width="60%" height={40} />
                  ) : (
                    <Typography variant="h4" fontWeight={700}>
                      {statValues[index]}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            按型号分组
          </Typography>
          {isLoading || !data ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Skeleton variant="rounded" height={48} />
              <Skeleton variant="rounded" height={48} />
              <Skeleton variant="rounded" height={48} />
            </Box>
          ) : data.camerasByModel.length === 0 ? (
            <Typography color="text.secondary">暂无数据</Typography>
          ) : (
            <List disablePadding>
              {data.camerasByModel.map((item) => (
                <ListItem
                  key={item.model}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 1,
                    "&:hover": { bgcolor: "action.hover" },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <ListItemText primary={item.model} />
                  <Chip
                    label={`${item.count} 台`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
