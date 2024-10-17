import { ChipOwnProps } from "@mui/material";
import Cookies from "universal-cookie";

const cookies = new Cookies(null, { path: "/" });

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
  cookies.remove("ChessReinvent2024SessionID", { path: "/" });
  window.location.reload();
};
