import {
  Alert,
  Box,
  Button,
  ContentLayout,
  Header,
  Icon,
  SpaceBetween,
  Table,
  ButtonDropdown,
  StatusIndicator,
  Popover,
} from "@cloudscape-design/components";

import {
  onCreateSession,
  onDeleteSession,
  onUpdateGameStatus,
  onUpdateSession,
} from "../../../graphql/subscriptions";

import { CreateSession } from "./Sessions/CreateSession";
import { DeleteSession } from "./Sessions/DeleteSession";
import { useListActiveSessions } from "../api/queries";
import { useUpdateGameStatus } from "../api/mutations";
import { Box as MBox } from "@mui/material";
import { IAlertStatus } from "../../../common/types";
import { EditSession } from "./Sessions/EditSession";
import { generateClient } from "aws-amplify/api";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

export const AdminHomePage = () => {
  const sessions = useListActiveSessions();
  const [_, setCookie] = useCookies(["GenAIChessDemoSessionID"]);

  const [createSession, setCreateSession] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
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
        <Box
          margin={{
            horizontal: "xxxl",
            top: "xl",
            bottom: "xxxs",
          }}
        >
          <Header
            variant="h1"
            description="Click on the Session ID you wish to view before navigating to participant views"
          >
            Administrator Dashboard
          </Header>
        </Box>
      }
    >
      <Box margin={{ horizontal: "xxxl" }}>
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
            selectedItems={selectedItems}
            loading={sessions.isLoading}
            selectionType="single"
            onSelectionChange={({ detail }) =>
              setSelectedItems(detail.selectedItems)
            }
            header={
              <Header
                variant="h3"
                description="Create, delete or modify sessions"
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
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
                    <Button
                      disabled={sessions.isLoading}
                      loading={sessions.isRefetching}
                      onClick={() => sessions.refetch()}
                      iconName="refresh"
                    />
                  </SpaceBetween>
                }
              >
                Active Sessions
              </Header>
            }
            columnDefinitions={[
              {
                header: "Session ID",
                cell: (item) => (
                  <Button
                    variant="link"
                    onClick={() => {
                      setCookie("GenAIChessDemoSessionID", item.SessionID, {
                        path: "/",
                      });
                      setAlertStatus({
                        visible: true,
                        msg: (
                          <span>
                            Loaded Session ID: <b>{item.SessionID}</b>
                          </span>
                        ),
                        type: "info",
                      });
                    }}
                  >
                    {item.SessionID}
                  </Button>
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
                header: (
                  <Box textAlign="center">
                    <Icon name="status-info" />
                  </Box>
                ),
                width: 60,
                cell: (item) => {
                  switch (item.GameStatus) {
                    case "ERROR":
                      return (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Popover
                            content={`${item.Error}\n${item.Cause}`}
                            size="large"
                          >
                            <StatusIndicator type="error">
                              Error
                            </StatusIndicator>
                          </Popover>
                        </div>
                      );
                    case "PLAYING":
                      return (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <StatusIndicator type="in-progress">
                            In progress
                          </StatusIndicator>
                        </div>
                      );
                    case "PAUSED":
                      return (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <StatusIndicator type="stopped">
                            Stopped
                          </StatusIndicator>
                        </div>
                      );
                    case "COMPLETED":
                      return (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <StatusIndicator>Completed</StatusIndicator>
                        </div>
                      );
                    default:
                      return (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <StatusIndicator type="warning">
                            Warning
                          </StatusIndicator>
                        </div>
                      );
                  }
                },
              },
              {
                header: (
                  <Box textAlign="center">
                    <Icon name="settings" />
                  </Box>
                ),
                width: 40,
                cell: (item) => {
                  return (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <ButtonDropdown
                        disabled={item?.GameStatus === "COMPLETED"}
                        variant="icon"
                        expandToViewport
                        items={[
                          {
                            text: "Start",
                            id: "start",
                            disabled: item?.GameStatus === "PLAYING",
                          },
                          {
                            text: "Stop",
                            id: "stop",
                            disabled: item?.GameStatus !== "PLAYING",
                          },
                          {
                            text: "Edit",
                            id: "edit",
                            disabled: item?.GameStatus !== "PAUSED",
                          },
                        ]}
                        onItemClick={({ detail }) => {
                          if (["start", "stop"].includes(detail.id)) {
                            return updateGameStatus(item);
                          }
                          switch (detail.id) {
                            case "edit":
                              return setEditSession(item);
                            default:
                              break;
                          }
                        }}
                      >
                        <Icon name="settings" />
                      </ButtonDropdown>
                    </div>
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
                <b>No active sessions</b>
              </Box>
            }
            items={sessions.data?.items ?? []}
          />
        </SpaceBetween>
      </Box>

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
