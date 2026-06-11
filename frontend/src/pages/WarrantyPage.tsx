import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
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
import { useMemo, useState } from "react";
import {
  createWarrantyInfo,
  deleteWarrantyInfo,
  fetchCameras,
  fetchWarrantyInfo,
} from "../api/client";
import type { WarrantyInfoFormData } from "../types";

const emptyForm: WarrantyInfoFormData = {
  camera_id: 0,
  warranty_expiry_date: dayjs().add(1, "year").format("YYYY-MM-DD"),
  warranty_provider: "",
  notes: "",
};

function getErrorMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return String(err.response.data.error);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function WarrantyPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WarrantyInfoFormData>(emptyForm);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraFilter, setCameraFilter] = useState<string>("");

  const {
    data: cameras = [],
    isLoading: camerasLoading,
  } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => fetchCameras(),
  });

  const {
    data: warrantyInfo = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["warranty-info", cameraFilter],
    queryFn: () =>
      fetchWarrantyInfo(cameraFilter ? Number(cameraFilter) : undefined),
  });

  const cameraMap = useMemo(() => {
    const map = new Map<number, string>();
    cameras.forEach((c) => {
      map.set(c.id, `${c.brand} ${c.model}`);
    });
    return map;
  }, [cameras]);

  const createMutation = useMutation({
    mutationFn: createWarrantyInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty-info"] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      setErrorMsg("新增失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarrantyInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty-info"] });
    },
    onError: (err) => {
      setErrorMsg("删除失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", headerName: "编号", width: 80, type: "number" },
      {
        field: "camera_id",
        headerName: "相机",
        width: 200,
        valueFormatter: (value: number) => cameraMap.get(value) || `相机 #${value}`,
      },
      {
        field: "warranty_expiry_date",
        headerName: "保修到期日期",
        width: 150,
        valueFormatter: (value: string) => dayjs(value).format("YYYY-MM-DD"),
      },
      { field: "warranty_provider", headerName: "保修提供方", width: 180 },
      { field: "notes", headerName: "备注", flex: 1, minWidth: 200 },
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
              if (window.confirm("确定删除该保修记录？")) {
                deleteMutation.mutate(params.row.id);
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [deleteMutation, cameraMap]
  );

  const handleSubmit = () => {
    if (!form.camera_id || !form.warranty_provider.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <VerifiedUserIcon />
          保修管理
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="camera-filter-label">按相机筛选</InputLabel>
            <Select
              labelId="camera-filter-label"
              value={cameraFilter}
              label="按相机筛选"
              onChange={(e) => setCameraFilter(e.target.value)}
            >
              <MenuItem value="">全部相机</MenuItem>
              {cameras.map((camera) => (
                <MenuItem key={camera.id} value={String(camera.id)}>
                  {camera.brand} {camera.model}
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
            新增保修
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
            rows={warrantyInfo}
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
        <DialogTitle>新增保修信息</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl>
            <InputLabel id="new-warranty-camera-label">相机</InputLabel>
            <Select
              labelId="new-warranty-camera-label"
              value={form.camera_id}
              label="相机"
              onChange={(e) => setForm({ ...form, camera_id: Number(e.target.value) })}
            >
              <MenuItem value={0}>请选择相机</MenuItem>
              {cameras.map((camera) => (
                <MenuItem key={camera.id} value={camera.id}>
                  {camera.brand} {camera.model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="保修到期日期"
            type="date"
            required
            InputLabelProps={{ shrink: true }}
            value={form.warranty_expiry_date}
            onChange={(e) => setForm({ ...form, warranty_expiry_date: e.target.value })}
          />
          <TextField
            label="保修提供方"
            required
            value={form.warranty_provider}
            onChange={(e) => setForm({ ...form, warranty_provider: e.target.value })}
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
            disabled={!form.camera_id || !form.warranty_provider.trim() || createMutation.isPending}
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
