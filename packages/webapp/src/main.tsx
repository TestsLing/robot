import ReactDOM from "react-dom/client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Leaderboard } from "./view/Admin/pages/Leaderboard/Leaderboard";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { SessionDashboard } from "./view/Admin/pages/SessionDashboard";
import { Controls } from "./view/Participant/pages/Controls/Controls";
import { ThreeDimensional } from "./view/Participant/pages/3D/3D";
import { ParticipantSetup } from "./view/Participant/ParticipantSetup";
import { AdminHomePage } from "./view/Admin/pages/AdminHomePage";
import { Toaster as CustomToast } from "./common/Toaster";
import { Authenticator } from "@aws-amplify/ui-react";
import { AdminSetup } from "./view/Admin/AdminSetup";
import { Toaster } from "react-hot-toast";
import { awsconfig } from "./aws-config";
import { Amplify } from "aws-amplify";
import { App } from "./App";

import "@cloudscape-design/global-styles/index.css";
import "@aws-amplify/ui-react/styles.css";
import "./themes/main.scss";
import "./index.css";

Amplify.configure(awsconfig);

export const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/admin",
        element: <AdminSetup />,
        children: [
          {
            path: "/admin",
            element: <AdminHomePage />,
          },
          {
            path: "/admin/:SessionID",
            element: <SessionDashboard />,
          },
          {
            path: "/admin/leaderboard",
            element: <Leaderboard />,
          },
        ],
      },
      {
        path: "/participant",
        element: <ParticipantSetup />,
        children: [
          {
            path: "/participant",
            element: <ThreeDimensional />,
          },
          {
            path: "/participant/controls",
            element: <Controls />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Authenticator hideSignUp variation="modal">
    {() => {
      return (
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <CustomToast />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontSize: "8px",
              },
            }}
          />
        </QueryClientProvider>
      );
    }}
  </Authenticator>
);