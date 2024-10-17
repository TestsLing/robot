import { useAtom } from "jotai";
import { capitalize } from "lodash";
import { Chip } from "@mui/material";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useLocation, useNavigate } from "react-router-dom";
import { connectionStatusAtom } from "../../../common/atom";
import { useIsAdmin, useUserAttributes } from "../../../common/api";
import { ConnectionStatusColor, changeSession } from "../utils/utils";
import {
  TopNavigation,
  TopNavigationProps,
} from "@cloudscape-design/components";

import Cookies from "universal-cookie";

const cookies = new Cookies(null, { path: "/" });
const SessionID = cookies.get("ChessReinvent2024SessionID");

export const HeaderNavigation = ({ setNavHeight }) => {
  const isAdmin = useIsAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const userAttributes = useUserAttributes();
  const [connectionStatus] = useAtom(connectionStatusAtom);

  const session = useQuery({ queryKey: ["session", SessionID] }) as any;

  const { signOut } = useAuthenticator((context) => [context.user]);

  const createUtilities = () => {
    const baseNav: TopNavigationProps.Utility[] = [
      {
        type: "button",
        text: `Session: ${SessionID}`,
      },
      {
        type: "button",
        text: (
          <Chip
            label={connectionStatus}
            color={ConnectionStatusColor(connectionStatus)}
          />
        ) as any,
      },
      {
        type: "button",
        text: (
          <Chip
            label={`Game ${
              session.data.GameStatus === "ERROR"
                ? "Paused"
                : capitalize(session.data.GameStatus)
            }`}
            color={
              ["PLAYING", "COMPLETED"].includes(session.data.GameStatus)
                ? "success"
                : "warning"
            }
          />
        ) as any,
      },
      {
        type: "menu-dropdown",
        iconName: "user-profile",
        text: [session.data?.WhiteID, session.data?.BlackID].includes(
          userAttributes.data.email
        )
          ? "Player"
          : "Viewer",
        onItemClick: ({ detail }) => {
          switch (detail.id) {
            case "signout":
              return signOut();
          }
        },
        items: [
          {
            id: "signout",
            text: "Sign Out",
            iconName: "arrow-left",
          },
        ],
      },
      {
        type: "button",
        text: "Change Session",
        iconName: "redo",
        onClick: changeSession,
      },
    ];

    switch (location.pathname) {
      case "/participant/controls":
        baseNav.push({
          type: "button",
          iconName: "group",
          text: "3D",
          onClick: () => navigate("/participant"),
        });
        baseNav.push({
          type: "button",
          iconName: "user-profile",
          text: "Commentator",
          onClick: () => navigate("/participant/commentator"),
        });
        break;
      case "/participant":
        baseNav.push({
          type: "button",
          iconName: "multiscreen",
          text: "Controls",
          onClick: () => navigate("/participant/controls"),
        });
        baseNav.push({
          type: "button",
          iconName: "user-profile",
          text: "Commentator",
          onClick: () => navigate("/participant/commentator"),
        });
        break;
      case "/participant/commentator":
        baseNav.push({
          type: "button",
          iconName: "multiscreen",
          text: "Controls",
          onClick: () => navigate("/participant/controls"),
        });
        baseNav.push({
          type: "button",
          iconName: "group",
          text: "3D",
          onClick: () => navigate("/participant"),
        });
        break;
      default:
        break;
    }

    if (isAdmin.data) {
      baseNav.push({
        type: "button",
        iconName: "user-profile",
        text: "Admin",
        onClick: () => navigate("/admin"),
      });
    }

    return baseNav;
  };

  useEffect(() => {
    setNavHeight(ref.current.clientHeight);
  }, [ref.current]);

  useEffect(() => {
    window.addEventListener("resize", () => {
      setNavHeight(ref.current.clientHeight);
    });

    return () => window.removeEventListener("resize", () => {});
  }, []);

  return (
    <div ref={ref}>
      <TopNavigation
        identity={{ title: "Amazon Web Services", href: "/" }}
        utilities={createUtilities()}
      />
    </div>
  );
};
