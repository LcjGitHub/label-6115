import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCamera, deleteCamera, fetchCameras } from "../api/client";
import type { CameraFormData } from "../types";

const emptyForm: CameraFormData = {
  model: "",
  purchase_date: dayjs().format("YYYY-MM-DD"),
  estimated_shutter_count: 0,
  notes: "",
};

export default function CameraListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CameraFormData>(emptyForm);

  const { data: cameras = [], isLoading, isError } = useQuery({
    queryKey: ["cameras"],
    queryFn: fetchCameras,
  });

  const createMutation = useMutation({
    mutationFn: createCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      setOpen(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCamera,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cameras"] }),
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          新增相机
        </Button>
      </Box>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>加载失败，请确认后端已启动</Alert>}

      <Box sx={{ height: 420, bgcolor: "background.paper", borderRadius: 1 }}>
        <DataGrid
          rows={cameras}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          onRowClick={(params) => navigate(`/cameras/${params.row.id}`)}
          sx={{ cursor: "pointer", border: "none" }}
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
    </Box>
  );
}
