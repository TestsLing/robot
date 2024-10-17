import {
  Alert,
  Box,
  Button,
  ContentLayout,
  Header,
  Icon,
  Popover,
  SpaceBetween,
  StatusIndicator,
  Table,
} from "@cloudscape-design/components";
import { Box as MBox, Tooltip } from "@mui/material";
import { useListActiveSessions, useUpdateGameStatus } from "../api/api";
import { useEffect, useState } from "react";
import { CreateSession } from "./Sessions/CreateSession";
import { DeleteSession } from "./Sessions/DeleteSession";
import {
  onCreateSession,
  onDeleteSession,
  onUpdateGameStatus,
  onUpdateSession,
} from "../../../graphql/subscriptions";
import { IAlertStatus } from "../../../common/types";
import { generateClient } from "aws-amplify/api";
import { EditSession } from "./Sessions/EditSession";
import { Report } from "@mui/icons-material";

import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
const cookies = new Cookies(null, { path: "/" });

export const ActiveSessionsList = () => {
  const sessions = useListActiveSessions();
  const navigate = useNavigate();

  const [selectedItems, setSelectedItems] = useState([]);
  const [createSession, setCreateSession] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [delSession, setDelSession] = useState(false);

  const [alertStatus, setAlertStatus] = useState<IAlertStatus>({
    visible: false,
    msg: "",
    type: "info",
  });

  const { mutateAsync, isPending } = useUpdateGameStatus();

  const updateGameStatus = async ({ GameStatus, SessionID }) => {
    if (GameStatus !== "COMPLETED") {
      if (GameStatus === "PLAYING") {
        await mutateAsync({
          SessionID,
          GameStatus: "PAUSED",
        });
      } else {
        await mutateAsync({
          SessionID,
          GameStatus: "PLAYING",
        });
      }
    }
  };

  return (
    <ContentLayout
      header={
        <MBox pl={5} pb={2} pt={3}>
          <Header
            variant="h1"
            description="These are sessions picked up in the DynamoDB"
          >
            Active Sessions
          </Header>
        </MBox>
      }
    >
      <MBox px={5}>
        <SpaceBetween size="m">
          {alertStatus.visible && (
            <Alert
              type={alertStatus.type}
              dismissible
              onDismiss={() =>
                setAlertStatus({ visible: false, msg: "", type: "info" })
              }
            >
              {alertStatus.msg}
            </Alert>
          )}

          <Table
            loadingText="Retrieving Sessions"
            loading={sessions.isLoading}
            selectionType="single"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) =>
              setSelectedItems(detail.selectedItems)
            }
            header={
              <MBox display="flex" justifyContent={"space-between"}>
                <SpaceBetween size="s" alignItems="end" direction="horizontal">
                  <Button
                    variant="primary"
                    onClick={() => setCreateSession(true)}
                  >
                    Create
                  </Button>
                  <Button
                    disabled={!!!selectedItems.length}
                    onClick={() => setDelSession(true)}
                  >
                    Delete
                  </Button>
                </SpaceBetween>

                <SpaceBetween size="s" alignItems="end" direction="horizontal">
                  <Button onClick={() => navigate("/admin/leaderboard")}>
                    Leaderboard
                  </Button>
                  <Button
                    disabled={sessions.isLoading}
                    loading={sessions.isRefetching}
                    onClick={() => sessions.refetch()}
                  >
                    {!sessions.isRefetching && <Icon name="refresh" />}
                  </Button>
                </SpaceBetween>
              </MBox>
            }
            columnDefinitions={[
              {
                header: "Session ID",
                cell: (item) => (
                  <Popover
                    dismissButton={false}
                    position="top"
                    size="small"
                    triggerType="custom"
                    content={
                      <StatusIndicator type="success">
                        Session Set
                      </StatusIndicator>
                    }
                  >
                    <Button
                      variant="link"
                      onClick={() => {
                        cookies.set(
                          "ChessReinvent2024SessionID",
                          item.SessionID
                        );
                        window.location.reload();
                      }}
                    >
                      {item.SessionID}
                    </Button>
                  </Popover>
                ),
              },
              {
                header: "White",
                cell: (item) => {
                  return item.Turn === "White" ? (
                    <>{item.WhiteID} ♟️</>
                  ) : (
                    item.WhiteID
                  );
                },
              },
              {
                header: "Black",
                cell: (item) => {
                  return item.Turn === "Black" ? (
                    <>{item.BlackID} ♟️</>
                  ) : (
                    item.BlackID
                  );
                },
              },
              {
                header: "Actions",
                cell: (item) => {
                  switch (item?.GameStatus) {
                    case "PLAYING":
                      return (
                        <Button
                          loading={isPending}
                          onClick={() => updateGameStatus(item)}
                        >
                          Pause Game
                        </Button>
                      );
                    case "PAUSED":
                      return (
                        <MBox display="flex" gap={1}>
                          <Button
                            variant="primary"
                            loading={isPending}
                            onClick={() => updateGameStatus(item)}
                          >
                            Start Game
                          </Button>
                          <Button onClick={() => setEditSession(item)}>
                            Edit Game
                          </Button>
                        </MBox>
                      );
                    case "ERROR":
                      return (
                        <MBox display="flex" gap={1}>
                          <Button
                            variant="primary"
                            loading={isPending}
                            onClick={() => updateGameStatus(item)}
                          >
                            Start Game
                          </Button>
                          <Button onClick={() => setEditSession(item)}>
                            Edit Game
                          </Button>
                        </MBox>
                      );
                    case "COMPLETED":
                      return (
                        <Button disabled={true} variant="primary">
                          Completed
                        </Button>
                      );
                    default:
                      return <>Unhandled GameStatus: {item?.GameStatus}</>;
                  }
                },
              },
              {
                header: "",
                cell: (item) => {
                  if (!item.Error) return;

                  return (
                    <Tooltip title={item.Cause}>
                      <MBox
                        display="flex"
                        gap={0.5}
                        color={"#d32f2f"}
                        alignItems={"center"}
                        justifyContent={"center"}
                      >
                        <Report color="error" />
                        {item.Error}
                      </MBox>
                    </Tooltip>
                  );
                },
              },
            ]}
            empty={
              <Box
                margin={{ vertical: "xs" }}
                textAlign="center"
                color="inherit"
              >
                <b>No active sessions detected</b>
              </Box>
            }
            items={sessions.data?.items ?? []}
          />
        </SpaceBetween>
      </MBox>

      <CreateSession
        createSession={createSession}
        setCreateSession={setCreateSession}
        setAlertStatus={setAlertStatus}
      />

      {editSession && (
        <EditSession
          editSession={editSession}
          setEditSession={setEditSession}
          setAlertStatus={setAlertStatus}
        />
      )}

      <DeleteSession
        delSession={delSession}
        setDelSession={setDelSession}
        selectedItem={selectedItems[0]}
        setAlertStatus={setAlertStatus}
      />

      <PageSubscriptions refetch={sessions.refetch} />
    </ContentLayout>
  );
};

const PageSubscriptions = ({ refetch }) => {
  const client = generateClient();

  useEffect(() => {
    const createSession = client.graphql({ query: onCreateSession }).subscribe({
      next: () => refetch(),
    });

    const updateSession = client.graphql({ query: onUpdateSession }).subscribe({
      next: () => refetch(),
    });

    const updateGameStatus = client
      .graphql({ query: onUpdateGameStatus })
      .subscribe({
        next: () => refetch(),
      });

    const deleteSession = client.graphql({ query: onDeleteSession }).subscribe({
      next: () => refetch(),
    });

    return () => {
      createSession.unsubscribe();
      updateSession.unsubscribe();
      updateGameStatus.unsubscribe();
      deleteSession.unsubscribe();
    };
  }, []);

  return null;
};
