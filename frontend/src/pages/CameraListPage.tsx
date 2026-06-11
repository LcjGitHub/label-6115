import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import {
  Alert,
  Box,
  Button,
  Chip,
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
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCamera, deleteCamera, fetchCameras } from "../api/client";
import { CAMERA_STATUSES, type CameraFormData, type CameraStatus } from "../types";

const emptyForm: CameraFormData = {
  model: "",
  purchase_date: dayjs().format("YYYY-MM-DD"),
  estimated_shutter_count: 0,
  notes: "",
  status: "使用中",
};

const statusColorMap: Record<CameraStatus, "success" | "warning" | "default"> = {
  使用中: "success",
  维修中: "warning",
  闲置: "default",
};

function getErrorMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return String(err.response.data.error);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function CameraListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CameraFormData>(emptyForm);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => setErrorMsg(null);
  }, []);

  const {
    data: cameras = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cameras", statusFilter],
    queryFn: () => fetchCameras(statusFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: createCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      setErrorMsg("新增失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCamera,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cameras"] }),
    onError: (err) => {
      setErrorMsg("删除失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "model", headerName: "型号", flex: 1, minWidth: 160 },
      {
        field: "purchase_date",
        headerName: "购入日期",
        width: 130,
        valueFormatter: (value: string) => dayjs(value).format("YYYY-MM-DD"),
      },
      {
        field: "estimated_shutter_count",
        headerName: "预估快门数",
        width: 120,
        type: "number",
      },
      {
        field: "status",
        headerName: "状态",
        width: 110,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={statusColorMap[params.value as CameraStatus]}
            size="small"
            variant="outlined"
          />
        ),
      },
      { field: "notes", headerName: "备注", flex: 1, minWidth: 180 },
      {
        field: "actions",
        headerName: "操作",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="日志">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/cameras/${params.row.id}/usage-logs`);
                }}
              >
                <DescriptionIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("确定删除该相机？")) {
                  deleteMutation.mutate(params.row.id);
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ],
    [deleteMutation]
  );

  const handleSubmit = () => {
    if (!form.model.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          相机列表
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="status-filter-label">状态筛选</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="状态筛选"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">全部</MenuItem>
              {CAMERA_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            新增相机
          </Button>
        </Box>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={() => refetch()}>重试</Button>
        }>
          加载失败，请稍后重试
        </Alert>
      )}

      <Box sx={{ height: 420, bgcolor: "background.paper", borderRadius: 1 }}>
        <DataGrid
          rows={isLoading ? [] : cameras}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          onRowClick={(params) => navigate(`/cameras/${params.row.id}`)}
          sx={{ cursor: "pointer", border: "none" }}
          localeText={{
            MuiTablePagination: {
              labelRowsPerPage: "每页行数",
              labelDisplayedRows: ({ from, to, count }) =>
                count === -1 ? `${from}–${to} 共 ${to}` : `${from}–${to} 共 ${count}`,
            },
          }}
        />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新增相机</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="型号"
            required
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
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
            label="预估快门数"
            type="number"
            value={form.estimated_shutter_count}
            onChange={(e) =>
              setForm({ ...form, estimated_shutter_count: Number(e.target.value) })
            }
          />
          <FormControl>
            <InputLabel id="new-camera-status-label">状态</InputLabel>
            <Select
              labelId="new-camera-status-label"
              value={form.status}
              label="状态"
              onChange={(e) => setForm({ ...form, status: e.target.value as CameraStatus })}
            >
              {CAMERA_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          <Button variant="contained" onClick={handleSubmit} disabled={!form.model.trim()}>
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
