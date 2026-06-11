import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LensIcon from "@mui/icons-material/Lens";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
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

export default function LensAccessoryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LensAccessoryFormData>(emptyForm);

  const { data: accessories = [], isLoading, isError } = useQuery({
    queryKey: ["lensAccessories"],
    queryFn: () => fetchLensAccessories(),
  });

  const { data: cameras = [] } = useQuery({
    queryKey: ["cameras"],
    queryFn: fetchCameras,
  });

  const cameraMap = useMemo(() => {
    const map: Record<number, string> = {};
    cameras.forEach((cam) => {
      map[cam.id] = cam.model;
    });
    return map;
  }, [cameras]);

  const createMutation = useMutation({
    mutationFn: createLensAccessory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lensAccessories"] });
      setOpen(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLensAccessory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lensAccessories"] }),
  });

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "camera_id",
        headerName: "所属相机",
        width: 160,
        valueFormatter: (value: number) => cameraMap[value] ?? "-",
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
            onClick={(e) => {
              e.stopPropagation();
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

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LensIcon />
          配件管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          新增配件
        </Button>
      </Box>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>加载失败，请确认后端已启动</Alert>}

      <Box sx={{ height: 420, bgcolor: "background.paper", borderRadius: 1 }}>
        <DataGrid
          rows={accessories}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          sx={{ border: "none" }}
        />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新增配件</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            select
            label="所属相机"
            required
            value={form.camera_id}
            onChange={(e) => setForm({ ...form, camera_id: Number(e.target.value) })}
          >
            <MenuItem value={0} disabled>请选择相机</MenuItem>
            {cameras.map((cam) => (
              <MenuItem key={cam.id} value={cam.id}>
                {cam.model}
              </MenuItem>
            ))}
          </TextField>
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
    </Box>
  );
}
