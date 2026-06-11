import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { zhCN } from "@mui/x-data-grid/locales";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  createMaintenancePlan,
  deleteMaintenancePlan,
  fetchCameras,
  fetchMaintenancePlans,
} from "../api/client";
import { useErrorSnackbar } from "../hooks/useErrorSnackbar";
import type { MaintenancePlanFormData } from "../types";

const emptyForm: MaintenancePlanFormData = {
  camera_id: 0,
  plan_name: "",
  next_maintenance_date: dayjs().add(3, "month").format("YYYY-MM-DD"),
  reminder_notes: "",
};

export default function MaintenancePlanPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MaintenancePlanFormData>(emptyForm);
  const [filterCameraId, setFilterCameraId] = useState<number | "all">("all");
  const { showError, ErrorSnackbar } = useErrorSnackbar();

  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => fetchCameras(),
  });

  const cameraMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of cameras) m.set(c.id, `${c.brand} ${c.model}`);
    return m;
  }, [cameras]);

  const {
    data: plans = [],
    isLoading: plansLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["maintenancePlans", filterCameraId],
    queryFn: () =>
      fetchMaintenancePlans(filterCameraId === "all" ? undefined : filterCameraId),
  });

  const createMutation = useMutation({
    mutationFn: createMaintenancePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenancePlans"] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      showError("新增失败：", err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenancePlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenancePlans"] }),
    onError: (err) => {
      showError("删除失败：", err);
    },
  });

  const today = dayjs().startOf("day");

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", headerName: "编号", width: 80, type: "number" },
      {
        field: "camera_id",
        headerName: "关联相机",
        width: 200,
        valueFormatter: (value: number) => cameraMap.get(value) ?? `相机 #${value}`,
      },
      { field: "plan_name", headerName: "计划名称", flex: 1, minWidth: 180 },
      {
        field: "next_maintenance_date",
        headerName: "下次保养日期",
        width: 160,
        valueFormatter: (value: string) => dayjs(value).format("YYYY-MM-DD"),
        renderCell: (params) => {
          const date = dayjs(params.value);
          const isOverdue = date.isBefore(today);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
              <span>{dayjs(params.value).format("YYYY-MM-DD")}</span>
              {isOverdue && (
                <Chip
                  label="逾期"
                  size="small"
                  sx={{
                    bgcolor: "orange.500",
                    color: "white",
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          );
        },
      },
      { field: "reminder_notes", headerName: "提醒备注", flex: 1, minWidth: 200 },
      {
        field: "actions",
        headerName: "操作",
        width: 80,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              if (window.confirm("确定删除该保养计划？")) {
                deleteMutation.mutate(params.row.id);
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [cameraMap, deleteMutation, today]
  );

  const handleSubmit = () => {
    if (!form.plan_name.trim() || form.camera_id === 0 || !form.next_maintenance_date) return;
    createMutation.mutate(form);
  };

  const isLoading = plansLoading || camerasLoading;

  const getRowClassName = (params: { row: { next_maintenance_date: string } }) => {
    const date = dayjs(params.row.next_maintenance_date);
    if (date.isBefore(today)) {
      return "overdue-row";
    }
    return "";
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EventRepeatIcon />
          保养计划提醒
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="plan-filter-label">按相机筛选</InputLabel>
            <Select
              labelId="plan-filter-label"
              label="按相机筛选"
              value={filterCameraId}
              onChange={(e) => setFilterCameraId(e.target.value as number | "all")}
              disabled={camerasLoading}
            >
              <MenuItem value="all">全部相机</MenuItem>
              {cameras.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.brand} {c.model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            disabled={camerasLoading || cameras.length === 0}
          >
            新增计划
          </Button>
        </Box>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={() => refetch()}>重试</Button>
        }>
          加载失败，请确认后端已启动
        </Alert>
      )}

      <Box
        sx={{
          height: 420,
          bgcolor: "background.paper",
          borderRadius: 1,
          position: "relative",
          "& .overdue-row": {
            bgcolor: "rgba(255, 152, 0, 0.08)",
          },
          "& .overdue-row:hover": {
            bgcolor: "rgba(255, 152, 0, 0.15) !important",
          },
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={plans}
            columns={columns}
            loading={isLoading}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            sx={{ border: "none" }}
            getRowClassName={getRowClassName}
            localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
          />
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新增保养计划</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>关联相机</InputLabel>
            <Select
              value={form.camera_id || ""}
              label="关联相机"
              onChange={(e) => setForm({ ...form, camera_id: Number(e.target.value) })}
            >
              {cameras.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.brand} {c.model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="计划名称"
            required
            value={form.plan_name}
            onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
          />
          <TextField
            label="下次保养日期"
            type="date"
            required
            InputLabelProps={{ shrink: true }}
            value={form.next_maintenance_date}
            onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })}
          />
          <TextField
            label="提醒备注"
            multiline
            rows={3}
            value={form.reminder_notes}
            onChange={(e) => setForm({ ...form, reminder_notes: e.target.value })}
            placeholder="例如：每季度清洁一次传感器"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.plan_name.trim() || form.camera_id === 0 || !form.next_maintenance_date || createMutation.isPending}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <ErrorSnackbar />
    </Box>
  );
}
