import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  createFilterOptions,
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
  fetchMaintenanceTypes,
  updateCamera,
} from "../api/client";
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
      setMaintenanceForm({ maintenance_date: dayjs().format("YYYY-MM-DD"), content: "" });
    },
    onError: (err) => {
      setErrorMsg("添加保养失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: deleteMaintenance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance", cameraId] }),
    onError: (err) => {
      setErrorMsg("删除保养失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const form = cameraForm ?? (camera
    ? {
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
    if (!form.model.trim()) return;
    updateMutation.mutate(form);
  };

  const handleAddMaintenance = () => {
    if (!maintenanceForm.content.trim()) return;
    createMaintenanceMutation.mutate(maintenanceForm);
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
          <Typography variant="h6" fontWeight={600} gutterBottom>
            保养记录
          </Typography>

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
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => {
                        if (window.confirm("确定删除该保养记录？")) {
                          deleteMaintenanceMutation.mutate(record.id);
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{ bgcolor: "grey.50", mb: 1, borderRadius: 1 }}
                >
                  <ListItemText
                    primary={record.content}
                    secondary={dayjs(record.maintenance_date).format("YYYY-MM-DD")}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

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
