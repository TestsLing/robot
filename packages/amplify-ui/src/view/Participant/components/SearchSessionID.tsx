import {
  Box,
  Button,
  Container,
  Header,
  SpaceBetween,
  FormField,
  Input,
  Form,
  Alert,
  Spinner,
  Modal,
} from "@cloudscape-design/components";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { toastAtom } from "../../../common/atom";
import { useGetSession, useVerifySession } from "../api/api";
import { Box as MBox } from "@mui/material";
import {
  onDeleteSession,
  onUpdateGameStatus,
} from "../../../graphql/subscriptions";
import { generateClient } from "aws-amplify/api";

import Cookies from "universal-cookie";
const cookies = new Cookies(null, { path: "/" });
const SessionID = cookies.get("ChessReinvent2024SessionID");

export const SearchSessionID = ({ children }): JSX.Element | null => {
  const session = useGetSession(SessionID);
  const [endSession, setEndSession] = useState(false);
  const { mutateAsync, isPending } = useVerifySession();

  const [sessionInput, setSessionInput] = useState(null);
  const [, setToast] = useAtom(toastAtom);

  useEffect(() => {
    session.refetch();
  }, []);

  const [alertStatus, setAlertStatus] = useState({
    visible: false,
    msg: "",
    type: "info",
  });

  if (SessionID) {
    return session.isLoading ? (
      // Load while Session is being retrieved
      <MBox
        bgcolor={"#030810"}
        width={"100vw"}
        height={"100dvh"}
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        flexDirection={"column"}
        color={"red"}
        gap={4}
      >
        <Spinner />
        Verifying Your Session...
      </MBox>
    ) : !!session.data && !endSession ? (
      <>
        {children()}
        <PageSubscriptions
          SessionID={SessionID}
          refetch={session.refetch}
          setEndSession={setEndSession}
        />
      </>
    ) : (
      <Modal
        visible={true}
        footer={
          <Box float="right">
            <Button
              variant="primary"
              onClick={() => {
                cookies.remove("ChessReinvent2024SessionID", {
                  path: "/",
                });
                window.location.reload();
              }}
            >
              Change Session
            </Button>
          </Box>
        }
        header={`Session Ended: ${SessionID} `}
      >
        It seems session <b>{SessionID}</b> has been terminated. Please check
        into another session by clicking the button below.
      </Modal>
    );
  }

  const submit = async () => {
    if (!sessionInput) {
      setToast("Session ID cannot be empty");
    } else {
      try {
        await mutateAsync({ sessionInput });

        cookies.set("ChessReinvent2024SessionID", sessionInput);
        window.location.reload();
      } catch (error) {
        console.log(error);
        setAlertStatus({
          visible: true,
          msg: JSON.stringify(error),
          type: "error",
        });
      }
    }
  };

  return (
    <Box padding={"xxxl"}>
      <SpaceBetween size="m">
        {alertStatus.visible && (
          <Alert
            type={"error"}
            dismissible
            onDismiss={() =>
              setAlertStatus({ visible: false, msg: "", type: "error" })
            }
          >
            {alertStatus.msg}
          </Alert>
        )}
        <Form
          variant="embedded"
          actions={
            <Button variant="primary" onClick={submit} loading={isPending}>
              Submit
            </Button>
          }
        >
          <Container
            header={
              <Header description="Fill out below to connect and join a session of chess">
                Join a Game!!!
              </Header>
            }
          >
            <FormField label="Session ID">
              <Input
                onKeyDown={({ detail }) => {
                  detail.key === "Enter" && submit();
                }}
                disabled={isPending}
                invalid={sessionInput === ""}
                value={sessionInput}
                placeholder="Enter the session ID..."
                onChange={({ detail }) => setSessionInput(detail.value)}
              />
            </FormField>
          </Container>
        </Form>
      </SpaceBetween>
    </Box>
  );
};

const PageSubscriptions = ({ SessionID, refetch, setEndSession }) => {
  const client = generateClient();

  useEffect(() => {
    const updateGameStatus = client
      .graphql({ query: onUpdateGameStatus, variables: { SessionID } })
      .subscribe({
        next: () => refetch(),
      });

    const deleteSession = client
      .graphql({ query: onDeleteSession, variables: { SessionID } })
      .subscribe({
        next: () => setEndSession(true),
      });

    return () => {
      updateGameStatus.unsubscribe();
      deleteSession.unsubscribe();
    };
  }, []);

  return null;
};
