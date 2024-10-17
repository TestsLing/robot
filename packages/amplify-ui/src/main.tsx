import "./index.css";
import "./themes/main.scss";
import "@aws-amplify/ui-react/styles.css";
import "@cloudscape-design/global-styles/index.css";

import ReactDOM from "react-dom/client";

import { App } from "./App";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Controls } from "./view/Participant/pages/Controls/Controls";
import { awsconfig } from "./aws-config";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminSetup } from "./view/Admin/AdminSetup";
import { SessionDashboard } from "./view/Admin/pages/SessionDashboard";
import { ActiveSessionsList } from "./view/Admin/pages/ActiveSessionsList";
import { ThreeDimensional } from "./view/Participant/pages/3D/3D";
import { Toaster as CustomToast } from "./common/Toaster";
import { Participant } from "./view/Participant/Participant";
import { Commentator } from "./view/Participant/pages/Commentator/Commentator";
import { Leaderboard } from "./view/Admin/pages/Leaderboard/Leaderboard";
import { Toaster } from "react-hot-toast";

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
            element: <ActiveSessionsList />,
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
        element: <Participant />,
        children: [
          {
            path: "/participant",
            element: <ThreeDimensional />,
          },
          {
            path: "/participant/controls",
            element: <Controls />,
          },
          {
            path: "/participant/commentator",
            element: <Commentator />,
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
