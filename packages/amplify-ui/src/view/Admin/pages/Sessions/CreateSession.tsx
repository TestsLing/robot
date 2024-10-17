import {
  Modal,
  Box,
  SpaceBetween,
  FormField,
  SegmentedControl,
  Button,
  Input,
  Select,
} from "@cloudscape-design/components";

import { useState } from "react";
import { modelOptions } from "./modelOptions";
import { useCreateSession } from "../../api/api";

export const CreateSession = ({
  createSession,
  setCreateSession,
  setAlertStatus,
}: any) => {
  const { mutateAsync, isPending } = useCreateSession();

  const [sessionID, setSessionID] = useState(null);
  const [white, setWhite] = useState("genai");
  const [black, setBlack] = useState("genai");

  const defaultModel = {
    label: "Claude 3 Sonnet",
    value: "anthropic.claude-3-sonnet-20240229-v1:0",
  };
  const [whiteID, setWhiteID] = useState<any>(defaultModel);
  const [blackID, setBlackID] = useState<any>(defaultModel);

  const submitNewSession = async () => {
    try {
      await mutateAsync({
        sessionID,
        white,
        whiteID: whiteID.value ?? whiteID,
        black,
        blackID: blackID.value ?? blackID,
      });

      setSessionID(null);
      setAlertStatus({
        visible: true,
        msg: "Record created",
        type: "success",
      });
    } catch (error) {
      console.log(error);
      setAlertStatus({
        visible: true,
        msg: JSON.stringify(error),
        type: "error",
      });
    } finally {
      setCreateSession(false);
    }
  };

  return (
    <Modal
      onDismiss={() => setCreateSession(false)}
      visible={createSession}
      footer={
        <Box float="right">
          <Button
            disabled={!!!sessionID || !!!whiteID || !!!blackID}
            variant="primary"
            loading={isPending}
            onClick={submitNewSession}
          >
            Create
          </Button>
        </Box>
      }
      header="New Session"
    >
      <SpaceBetween direction="vertical" size="l">
        <FormField label="Session ID">
          <Input
            disabled={isPending}
            value={sessionID}
            placeholder="Enter a session ID..."
            onChange={({ detail }) => setSessionID(detail.value)}
          />
        </FormField>
        <FormField label="White">
          <SegmentedControl
            label="Default segmented control"
            selectedId={white}
            onChange={({ detail }) => {
              setWhite(detail.selectedId);
              if (detail.selectedId === "genai") {
                setWhiteID(defaultModel);
              } else {
                setWhiteID(null);
              }
            }}
            options={[
              { text: "GenAI Bot", id: "genai" },
              { text: "Player", id: "player" },
              { text: "Random", id: "random" },
              { text: "Chess Engine", id: "chessengine" },
            ]}
          />
        </FormField>
        <SwitchInputField
          field={"White"}
          selectKey={white}
          id={whiteID}
          setId={setWhiteID}
          isPending={isPending}
        />
        <FormField label="Black">
          <SegmentedControl
            label="Default segmented control"
            selectedId={black}
            onChange={({ detail }) => {
              setBlack(detail.selectedId);
              if (detail.selectedId === "genai") {
                setBlackID(defaultModel);
              } else {
                setBlackID(null);
              }
            }}
            options={[
              { text: "GenAI Bot", id: "genai" },
              { text: "Player", id: "player" },
              { text: "Random", id: "random" },
              { text: "Chess Engine", id: "chessengine" },
            ]}
          />
        </FormField>
        <SwitchInputField
          field={"Black"}
          selectKey={black}
          id={blackID}
          setId={setBlackID}
          isPending={isPending}
        />
      </SpaceBetween>
    </Modal>
  );
};

const SwitchInputField = ({ field, selectKey, id, setId, isPending }) => {
  switch (selectKey) {
    case "random": {
      return setId("random");
    }
    case "player": {
      return (
        <FormField label={`${field} ID`}>
          <Input
            disabled={isPending}
            value={id}
            placeholder="Player email..."
            onChange={({ detail }) => setId(detail.value)}
          />
        </FormField>
      );
    }
    case "genai": {
      return (
        <FormField label={`${field} ID`}>
          <Select
            selectedOption={id}
            onChange={({ detail }: any) => setId(detail.selectedOption)}
            options={modelOptions}
          />
        </FormField>
      );
    }
    case "chessengine": {
      return (
        <FormField label={`Engine Level`}>
          <Select
            selectedOption={id}
            onChange={({ detail }: any) => setId(detail.selectedOption)}
            options={[
              { label: "Beginner", value: "ChessEngine-0" },
              { label: "Intermediate", value: "ChessEngine-1" },
              { label: "Advanced", value: "ChessEngine-2" },
            ]}
          />
        </FormField>
      );
    }
  }
};
