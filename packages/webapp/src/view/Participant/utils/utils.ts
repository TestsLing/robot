import { ChipOwnProps } from "@mui/material";
import { useCookies } from "react-cookie";

export const ConnectionStatusColor = (
  connectionStatus: string
): ChipOwnProps["color"] => {
  switch (connectionStatus) {
    case "Disconnected":
      return "error";
    case "Connecting":
      return "info";
    case "Connected":
      return "success";
    default:
      return "warning";
  }
};

export const changeSession = () => {
  const [, , remove] = useCookies();

  remove("GenAIChessDemoSessionID", { path: "/" });
  window.location.reload();
};
