import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createUsageLog, fetchCamera, fetchUsageLogs } from "../api/client";
import type { UsageLogFormData } from "../types";

const emptyForm: UsageLogFormData = {
  record_date: dayjs().format("YYYY-MM-DD"),
  content: "",
  recorder: "",
};

function getErrorMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return String(err.response.data.error);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function CameraUsageLogPage() {
  const { id } = useParams<{ id: string }>();
  const cameraId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UsageLogFormData>(emptyForm);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => setErrorMsg(null);
  }, []);

  const { data: camera, isLoading: cameraLoading, isError: cameraError } = useQuery({
    queryKey: ["camera", cameraId],
    queryFn: () => fetchCamera(cameraId),
    enabled: !!cameraId,
  });

  const {
    data: logs = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["usage-logs", cameraId],
    queryFn: () => fetchUsageLogs(cameraId),
    enabled: !!cameraId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: UsageLogFormData) => createUsageLog(cameraId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usage-logs", cameraId] });
      setForm(emptyForm);
    },
    onError: (err) => {
      setErrorMsg("提交失败：" + getErrorMsg(err, "请稍后重试"));
    },
  });

  const handleSubmit = () => {
    if (!form.record_date.trim() || !form.content.trim() || !form.recorder.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")}>
          返回列表
        </Button>
        {cameraLoading ? (
          <CircularProgress size={24} sx={{ ml: 1 }} />
        ) : (
          <Typography variant="h5" fontWeight={600}>
            {camera ? `${camera.model} - 使用日志` : "使用日志"}
          </Typography>
        )}
      </Box>

      {cameraError && <Alert severity="error" sx={{ mb: 2 }}>相机不存在，请确认编号正确</Alert>}
      {isError && !cameraError && <Alert severity="error" sx={{ mb: 2 }}>加载失败，请确认后端已启动</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            日志记录
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {isLoading || cameraLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : cameraError ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              相机不存在，无法加载日志
            </Typography>
          ) : logs.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              暂无使用日志
            </Typography>
          ) : (
            <List disablePadding>
              {logs.map((log) => (
                <ListItem key={log.id} sx={{ px: 0, py: 1.5 }} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                          <CalendarTodayIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">{dayjs(log.record_date).format("YYYY-MM-DD")}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">{log.recorder}</Typography>
                        </Box>
                      </Box>
                    }
                    secondary={log.content}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            追加新日志
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="记录日期"
              type="date"
              required
              InputLabelProps={{ shrink: true }}
              size="small"
              value={form.record_date}
              onChange={(e) => setForm({ ...form, record_date: e.target.value })}
            />
            <TextField
              label="日志内容"
              required
              multiline
              rows={3}
              size="small"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <TextField
              label="记录人"
              required
              size="small"
              value={form.recorder}
              onChange={(e) => setForm({ ...form, recorder: e.target.value })}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!form.record_date.trim() || !form.content.trim() || !form.recorder.trim() || createMutation.isPending}
              >
                提交
              </Button>
            </Box>
          </Box>
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
