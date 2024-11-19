import { Snackbar } from "@mui/material";
import { useAtom } from "jotai";
import { toasterAtom } from "./atom";

export const Toaster = () => {
  const [toast, setToast]: any[] = useAtom(toasterAtom);

  return (
    <Snackbar
      open={toast.open}
      onClose={() => setToast({ open: false, msg: toast.msg })}
      message={toast.msg}
    />
  );
};
