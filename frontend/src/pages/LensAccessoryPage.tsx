import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LensIcon from "@mui/icons-material/Lens";
import {
  Alert,
  Box,
  Button,
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
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { zhCN } from "@mui/x-data-grid/locales";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  createLensAccessory,
  deleteLensAccessory,
  fetchCameras,
  fetchLensAccessories,
} from "../api/client";
import type { LensAccessoryFormData } from "../types";

const emptyForm: LensAccessoryFormData = {
  camera_id: 0,
  accessory_name: "",
  focal_length_description: "",
  purchase_date: dayjs().format("YYYY-MM-DD"),
  notes: "",
};

function getErrorMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return String(err.response.data.error);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function LensAccessoryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LensAccessoryFormData>(emptyForm);
  const [filterCameraId, setFilterCameraId] = useState<number | "all">("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => setErrorMsg(null);
  }, []);

  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => fetchCameras(),
  });

  const cameraMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of cameras) m.set(c.id, c.model);
    return m;
  }, [cameras]);

  const {
    data: accessories = [],
    isLoading: accessoriesLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["lensAccessories", filterCameraId],
    queryFn: () =>
      fetchLensAccessories(filterCameraId === "all" ? undefined : filterCameraId),
  });

  const createMutation = useMutation({
    mutationFn: createLensAccessory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lensAccessories"] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      setErrorMsg("新增失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLensAccessory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lensAccessories"] }),
    onError: (err) => {
      setErrorMsg("删除失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", headerName: "编号", width: 80, type: "number" },
      {
        field: "camera_id",
        headerName: "所属相机",
        width: 160,
        valueFormatter: (value: number) => cameraMap.get(value) ?? "-",
      },
      { field: "accessory_name", headerName: "配件名称", flex: 1, minWidth: 200 },
      {
        field: "focal_length_description",
        headerName: "焦段描述",
        flex: 1,
        minWidth: 180,
      },
      {
        field: "purchase_date",
        headerName: "购入日期",
        width: 130,
        valueFormatter: (value: string) => dayjs(value).format("YYYY-MM-DD"),
      },
      { field: "notes", headerName: "备注", flex: 1, minWidth: 180 },
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
              if (window.confirm("确定删除该配件？")) {
                deleteMutation.mutate(params.row.id);
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [cameraMap, deleteMutation]
  );

  const handleSubmit = () => {
    if (!form.accessory_name.trim() || form.camera_id === 0) return;
    createMutation.mutate(form);
  };

  const isLoading = accessoriesLoading || camerasLoading;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LensIcon />
          配件管理
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="lens-filter-label">按相机筛选</InputLabel>
            <Select
              labelId="lens-filter-label"
              label="按相机筛选"
              value={filterCameraId}
              onChange={(e) => setFilterCameraId(e.target.value as number | "all")}
              disabled={camerasLoading}
            >
              <MenuItem value="all">全部相机</MenuItem>
              {cameras.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            新增配件
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

      <Box sx={{ height: 420, bgcolor: "background.paper", borderRadius: 1, position: "relative" }}>
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
            rows={accessories}
            columns={columns}
            loading={isLoading}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            sx={{ border: "none" }}
            localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
          />
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新增配件</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>所属相机</InputLabel>
            <Select
              value={form.camera_id || ""}
              label="所属相机"
              onChange={(e) => setForm({ ...form, camera_id: Number(e.target.value) })}
            >
              {cameras.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="配件名称"
            required
            value={form.accessory_name}
            onChange={(e) => setForm({ ...form, accessory_name: e.target.value })}
          />
          <TextField
            label="焦段描述"
            value={form.focal_length_description}
            onChange={(e) => setForm({ ...form, focal_length_description: e.target.value })}
          />
          <TextField
            label="购入日期"
            type="date"
            required
            InputLabelProps={{ shrink: true }}
            value={form.purchase_date}
            onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
          />
          <TextField
            label="备注"
            multiline
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.accessory_name.trim() || form.camera_id === 0}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={() => setErrorMsg(null)}
          sx={{ width: "100%" }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
