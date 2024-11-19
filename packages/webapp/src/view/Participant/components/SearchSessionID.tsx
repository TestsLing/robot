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
  Modal,
  Spinner,
} from "@cloudscape-design/components";

import { useVerifySession } from "../api/mutations";
import { toastAtom } from "../../../common/atom";
import { generateClient } from "aws-amplify/api";
import { useGetSession } from "../api/queries";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useAtom } from "jotai";

import {
  onDeleteSession,
  onUpdateGameStatus,
} from "../../../graphql/subscriptions";

export const SearchSessionID = ({ children }): JSX.Element | null => {
  const { mutateAsync, isPending } = useVerifySession();

  const [cookie, setCookie, remove] = useCookies(["GenAIChessDemoSessionID"]);
  const [sessionInput, setSessionInput] = useState(null);
  const [endSession, setEndSession] = useState(false);
  const [, setToast] = useAtom(toastAtom);

  const [alertStatus, setAlertStatus] = useState({
    visible: false,
    msg: "",
    type: "info",
  });

  const session = useGetSession(cookie.GenAIChessDemoSessionID);

  useEffect(() => {
    session.refetch();
  }, []);

  if (cookie.GenAIChessDemoSessionID) {
    return session.isLoading ? (
      // Load while Session is being retrieved
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size="large" />
      </div>
    ) : !!session.data && !endSession ? (
      <>
        {children()}
        <PageSubscriptions
          SessionID={cookie.GenAIChessDemoSessionID}
          setEndSession={setEndSession}
          refetch={session.refetch}
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
                remove("GenAIChessDemoSessionID", {
                  path: "/",
                });
                window.location.reload();
              }}
            >
              Change Session
            </Button>
          </Box>
        }
        header={`Session Ended: ${cookie.GenAIChessDemoSessionID} `}
      >
        It seems session <b>{cookie.GenAIChessDemoSessionID}</b> has been
        terminated. Please check into another session by clicking the button
        below.
      </Modal>
    );
  }

  const submit = async () => {
    if (!sessionInput) {
      setToast("Session ID cannot be empty");
    } else {
      try {
        await mutateAsync({ sessionInput });
        setCookie("GenAIChessDemoSessionID", sessionInput, {
          path: "/",
        });
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
      .subscribe({ next: () => refetch() });

    const deleteSession = client
      .graphql({ query: onDeleteSession, variables: { SessionID } })
      .subscribe({ next: () => setEndSession(true) });

    return () => {
      updateGameStatus.unsubscribe();
      deleteSession.unsubscribe();
    };
  }, []);

  return null;
};
