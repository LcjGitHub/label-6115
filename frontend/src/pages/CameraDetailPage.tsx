import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  createFilterOptions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createMaintenance,
  deleteMaintenance,
  fetchCamera,
  fetchMaintenance,
  fetchMaintenanceTotalCost,
  fetchMaintenanceTypes,
  updateCamera,
  updateMaintenance,
} from "../api/client";
import type { MaintenanceRecord } from "../types";
import { CAMERA_STATUSES, type CameraFormData, type CameraStatus, type MaintenanceFormData } from "../types";

const filterOptions = createFilterOptions<string>({
  stringify: (option) => option,
  trim: true,
});

function getErrorMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return String(err.response.data.error);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function CameraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const cameraId = Number(id);
  const queryClient = useQueryClient();

  const [cameraForm, setCameraForm] = useState<CameraFormData | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceFormData>({
    maintenance_date: dayjs().format("YYYY-MM-DD"),
    content: "",
    cost: 0,
  });
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [editForm, setEditForm] = useState<MaintenanceFormData>({
    maintenance_date: "",
    content: "",
    cost: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => setErrorMsg(null);
  }, []);

  const {
    data: camera,
    isLoading: cameraLoading,
    isError: cameraError,
  } = useQuery({
    queryKey: ["camera", cameraId],
    queryFn: () => fetchCamera(cameraId),
    enabled: !isNaN(cameraId),
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["maintenance", cameraId],
    queryFn: () => fetchMaintenance(cameraId),
    enabled: !isNaN(cameraId) && !!camera,
  });

  const { data: totalCost, isLoading: totalCostLoading } = useQuery({
    queryKey: ["maintenance-total-cost", cameraId],
    queryFn: () => fetchMaintenanceTotalCost(cameraId),
    enabled: !isNaN(cameraId) && !!camera,
  });

  const { data: maintenanceTypes = [] } = useQuery({
    queryKey: ["maintenance-types"],
    queryFn: fetchMaintenanceTypes,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CameraFormData) => updateCamera(cameraId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camera", cameraId] });
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
    },
    onError: (err) => {
      setErrorMsg("保存失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: (payload: MaintenanceFormData) => createMaintenance(cameraId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", cameraId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-total-cost", cameraId] });
      setMaintenanceForm({ maintenance_date: dayjs().format("YYYY-MM-DD"), content: "", cost: 0 });
    },
    onError: (err) => {
      setErrorMsg("添加保养失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: deleteMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", cameraId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-total-cost", cameraId] });
    },
    onError: (err) => {
      setErrorMsg("删除保养失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MaintenanceFormData }) =>
      updateMaintenance(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", cameraId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-total-cost", cameraId] });
      setEditingRecord(null);
    },
    onError: (err) => {
      setErrorMsg("更新保养失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const form = cameraForm ?? (camera
    ? {
        brand: camera.brand,
        model: camera.model,
        purchase_date: camera.purchase_date,
        estimated_shutter_count: camera.estimated_shutter_count,
        notes: camera.notes,
        status: (camera.status as CameraStatus) ?? "使用中",
      }
    : null);

  if (cameraLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (cameraError || !camera || !form) {
    return <Alert severity="error">相机不存在或加载失败</Alert>;
  }

  const handleCameraSave = () => {
    if (!form.brand.trim() || !form.model.trim()) return;
    updateMutation.mutate(form);
  };

  const handleAddMaintenance = () => {
    if (!maintenanceForm.content.trim()) return;
    createMaintenanceMutation.mutate(maintenanceForm);
  };

  const handleEditClick = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setEditForm({
      maintenance_date: record.maintenance_date,
      content: record.content,
      cost: record.cost,
    });
  };

  const handleUpdateMaintenance = () => {
    if (!editingRecord || !editForm.maintenance_date.trim() || !editForm.content.trim()) return;
    updateMaintenanceMutation.mutate({ id: editingRecord.id, payload: editForm });
  };

  return (
    <Box>
      <Button component={Link} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        返回列表
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            相机详情
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="品牌"
              value={form.brand}
              onChange={(e) => {
                setCameraForm({ ...form, brand: e.target.value });
              }}
            />
            <TextField
              label="型号"
              value={form.model}
              onChange={(e) => {
                setCameraForm({ ...form, model: e.target.value });
              }}
            />
            <TextField
              label="购入日期"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.purchase_date}
              onChange={(e) => {
                setCameraForm({ ...form, purchase_date: e.target.value });
              }}
            />
            <TextField
              label="预估快门数"
              type="number"
              value={form.estimated_shutter_count}
              onChange={(e) => {
                setCameraForm({ ...form, estimated_shutter_count: Number(e.target.value) });
              }}
            />
            <FormControl>
              <InputLabel id="camera-status-label">状态</InputLabel>
              <Select
                labelId="camera-status-label"
                value={form.status}
                label="状态"
                onChange={(e) => {
                  setCameraForm({ ...form, status: e.target.value as CameraStatus });
                }}
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
              value={form.notes}
              sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" } }}
              onChange={(e) => {
                setCameraForm({ ...form, notes: e.target.value });
              }}
            />
          </Box>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleCameraSave}
            disabled={updateMutation.isPending}
          >
            保存修改
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              保养记录
            </Typography>
            <Typography variant="body2" color="text.secondary">
              累计保养费用：{totalCostLoading ? (
                <CircularProgress size={14} sx={{ verticalAlign: "middle" }} />
              ) : (
                <Typography component="strong" variant="body2" fontWeight={600} color="primary">
                  ¥{(totalCost ?? 0).toFixed(2)}
                </Typography>
              )}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
            <TextField
              label="保养日期"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={maintenanceForm.maintenance_date}
              onChange={(e) =>
                setMaintenanceForm({ ...maintenanceForm, maintenance_date: e.target.value })
              }
            />
            <Autocomplete
              freeSolo
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
              options={maintenanceTypes.map((t) => t.type_name)}
              filterOptions={filterOptions}
              value={maintenanceForm.content}
              onInputChange={(_e, value) =>
                setMaintenanceForm({ ...maintenanceForm, content: value })
              }
              renderInput={(params) => (
                <TextField {...params} label="保养内容" />
              )}
            />
            <TextField
              label="费用(元)"
              type="number"
              size="small"
              sx={{ width: 120 }}
              inputProps={{ min: 0 }}
              value={maintenanceForm.cost}
              onChange={(e) =>
                setMaintenanceForm({ ...maintenanceForm, cost: Number(e.target.value) || 0 })
              }
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddMaintenance}
              disabled={!maintenanceForm.content.trim() || createMaintenanceMutation.isPending}
            >
              添加
            </Button>
          </Box>

          <Divider sx={{ mb: 1 }} />

          {recordsLoading ? (
            <CircularProgress size={24} />
          ) : records.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              暂无保养记录
            </Typography>
          ) : (
            <List>
              {records.map((record) => (
                <ListItem
                  key={record.id}
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="编辑">
                        <IconButton
                          edge="end"
                          color="primary"
                          disabled={updateMaintenanceMutation.isPending}
                          onClick={() => handleEditClick(record)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        edge="end"
                        color="error"
                        disabled={updateMaintenanceMutation.isPending}
                        onClick={() => {
                          if (window.confirm("确定删除该保养记录？")) {
                            deleteMaintenanceMutation.mutate(record.id);
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                  sx={{ bgcolor: "grey.50", mb: 1, borderRadius: 1 }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{record.content}</span>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          ¥{record.cost.toFixed(2)}
                        </Typography>
                      </Box>
                    }
                    secondary={dayjs(record.maintenance_date).format("YYYY-MM-DD")}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>编辑保养记录</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="保养日期"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={editForm.maintenance_date}
              onChange={(e) =>
                setEditForm({ ...editForm, maintenance_date: e.target.value })
              }
            />
            <Autocomplete
              freeSolo
              options={maintenanceTypes.map((t) => t.type_name)}
              filterOptions={filterOptions}
              value={editForm.content}
              onInputChange={(_e, value) =>
                setEditForm({ ...editForm, content: value })
              }
              renderInput={(params) => (
                <TextField {...params} label="保养内容" />
              )}
            />
            <TextField
              label="费用(元)"
              type="number"
              inputProps={{ min: 0 }}
              value={editForm.cost}
              onChange={(e) =>
                setEditForm({ ...editForm, cost: Number(e.target.value) || 0 })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingRecord(null)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleUpdateMaintenance}
            disabled={!editForm.maintenance_date.trim() || !editForm.content.trim() || updateMaintenanceMutation.isPending}
          >
            确认修改
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
