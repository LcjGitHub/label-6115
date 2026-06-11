import AddIcon from "@mui/icons-material/Add";
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
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef, zhCN } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState } from "react";
import { createMaintenanceType, fetchMaintenanceTypes } from "../api/client";
import type { MaintenanceTypeFormData } from "../types";

const CATEGORIES = ["清洁", "维修", "检测"];

const emptyForm: MaintenanceTypeFormData = {
  type_name: "",
  category: "清洁",
  description: "",
};

function getErrorMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return String(err.response.data.error);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function MaintenanceTypePage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MaintenanceTypeFormData>(emptyForm);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: types = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["maintenance-types"],
    queryFn: fetchMaintenanceTypes,
  });

  const createMutation = useMutation({
    mutationFn: createMaintenanceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-types"] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      setErrorMsg("新增失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", headerName: "编号", width: 80, type: "number" },
      { field: "type_name", headerName: "类型名称", width: 180 },
      { field: "category", headerName: "分类", width: 120 },
      { field: "description", headerName: "说明", flex: 1, minWidth: 200 },
    ],
    []
  );

  const handleSubmit = () => {
    if (!form.type_name.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          保养类型字典
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          新增类型
        </Button>
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
            rows={types}
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
        <DialogTitle>新增保养类型</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="类型名称"
            required
            value={form.type_name}
            onChange={(e) => setForm({ ...form, type_name: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>分类</InputLabel>
            <Select
              value={form.category}
              label="分类"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="说明"
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.type_name.trim() || createMutation.isPending}
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
