import { Alert, Snackbar } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { getErrorMsg } from "../utils/error";

interface UseErrorSnackbarResult {
  errorMsg: string | null;
  showError: (prefix: string, err: unknown, fallback?: string) => void;
  clearError: () => void;
  ErrorSnackbar: () => ReactNode;
}

export function useErrorSnackbar(): UseErrorSnackbarResult {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => setErrorMsg(null);
  }, []);

  const showError = (prefix: string, err: unknown, fallback: string = "请稍后重试") => {
    setErrorMsg(prefix + getErrorMsg(err, fallback));
  };

  const clearError = () => setErrorMsg(null);

  const ErrorSnackbar = () => (
    <Snackbar
      open={!!errorMsg}
      autoHideDuration={4000}
      onClose={clearError}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        severity="error"
        onClose={clearError}
        sx={{ width: "100%" }}
      >
        {errorMsg}
      </Alert>
    </Snackbar>
  );

  return { errorMsg, showError, clearError, ErrorSnackbar };
}
