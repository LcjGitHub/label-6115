import AddIcon from "@mui/icons-material/Add";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { zhCN } from "@mui/x-data-grid/locales";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState } from "react";
import {
  createRepairServiceProvider,
  deleteRepairServiceProvider,
  fetchRepairServiceProviders,
} from "../api/client";
import type { RepairServiceProviderFormData } from "../types";

const emptyForm: RepairServiceProviderFormData = {
  provider_name: "",
  phone: "",
  address: "",
  notes: "",
};

function getErrorMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return String(err.response.data.error);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function RepairServiceProviderPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RepairServiceProviderFormData>(emptyForm);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: providers = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["repair-service-providers"],
    queryFn: fetchRepairServiceProviders,
  });

  const createMutation = useMutation({
    mutationFn: createRepairServiceProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repair-service-providers"] });
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => {
      setErrorMsg("新增失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRepairServiceProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repair-service-providers"] });
    },
    onError: (err) => {
      setErrorMsg("删除失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", headerName: "编号", width: 80, type: "number" },
      { field: "provider_name", headerName: "服务商名称", width: 220 },
      { field: "phone", headerName: "联系电话", width: 160 },
      { field: "address", headerName: "地址", flex: 1, minWidth: 240 },
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
              if (window.confirm("确定删除该维修服务商？")) {
                deleteMutation.mutate(params.row.id);
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [deleteMutation]
  );

  const handleSubmit = () => {
    if (!form.provider_name.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BuildCircleIcon />
          维修服务商管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          新增服务商
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
            rows={providers}
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
        <DialogTitle>新增维修服务商</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="服务商名称"
            required
            value={form.provider_name}
            onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
          />
          <TextField
            label="联系电话"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <TextField
            label="地址"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
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
            disabled={!form.provider_name.trim() || createMutation.isPending}
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
