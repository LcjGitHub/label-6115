import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { createShutterCount, deleteShutterCount, fetchCameras, fetchShutterCounts } from "../api/client";
import type { ShutterCountFormData } from "../types";

const emptyForm: ShutterCountFormData = {
  camera_id: 0,
  record_date: dayjs().format("YYYY-MM-DD"),
  shutter_increment: 0,
  notes: "",
};

function getErrorMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return String(err.response.data.error);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function ShutterCountPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ShutterCountFormData>(emptyForm);
  const [filterCameraId, setFilterCameraId] = useState<number | "all">("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => setErrorMsg(null);
  }, []);

  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: fetchCameras,
  });

  const cameraMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of cameras) m.set(c.id, c.model);
    return m;
  }, [cameras]);

  const {
    data: records = [],
    isLoading: recordsLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["shutter-counts", filterCameraId],
    queryFn: () =>
      fetchShutterCounts(filterCameraId === "all" ? undefined : filterCameraId),
  });

  const createMutation = useMutation({
    mutationFn: createShutterCount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shutter-counts"] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      setErrorMsg("登记失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShutterCount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shutter-counts"] }),
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
        width: 160,
        valueFormatter: (value: number) => cameraMap.get(value) ?? String(value),
      },
      {
        field: "record_date",
        headerName: "记录日期",
        width: 130,
        valueFormatter: (value: string) => dayjs(value).format("YYYY-MM-DD"),
      },
      {
        field: "shutter_increment",
        headerName: "快门增量",
        width: 120,
        type: "number",
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
              if (window.confirm("确定删除该快门记录？")) {
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
    if (!form.camera_id || !form.record_date || form.shutter_increment <= 0) return;
    createMutation.mutate(form);
  };

  const isLoading = recordsLoading || camerasLoading;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          快门计数记录
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="shutter-filter-label">按相机筛选</InputLabel>
            <Select
              labelId="shutter-filter-label"
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
            登记快门
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

      <Box sx={{ height: 420, bgcolor: "background.paper", borderRadius: 1 }}>
        <DataGrid
          rows={records}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          sx={{ border: "none" }}
        />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>登记快门计数</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>相机</InputLabel>
            <Select
              value={form.camera_id || ""}
              label="相机"
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
            label="记录日期"
            type="date"
            required
            InputLabelProps={{ shrink: true }}
            value={form.record_date}
            onChange={(e) => setForm({ ...form, record_date: e.target.value })}
          />
          <TextField
            label="快门增量"
            type="number"
            required
            value={form.shutter_increment}
            onChange={(e) =>
              setForm({ ...form, shutter_increment: Number(e.target.value) })
            }
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
            disabled={!form.camera_id || !form.record_date || form.shutter_increment <= 0}
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
