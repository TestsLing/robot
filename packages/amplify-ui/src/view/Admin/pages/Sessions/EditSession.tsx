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
import { useEffect, useState } from "react";
import { useUpdateSession } from "../../api/api";
import { modelOptions } from "./modelOptions";

const chessengine_options = [
  { label: "Beginner", value: "ChessEngine-0" },
  { label: "Intermediate", value: "ChessEngine-1" },
  { label: "Advanced", value: "ChessEngine-2" },
];

export const EditSession = ({
  editSession,
  setEditSession,
  setAlertStatus,
}: any) => {
  const [white, setWhite] = useState(editSession.White);
  const [whiteID, setWhiteID] = useState(editSession.WhiteID);
  const [black, setBlack] = useState(editSession.Black);
  const [blackID, setBlackID] = useState(editSession.BlackID);

  const { mutateAsync, isPending } = useUpdateSession();

  useEffect(() => {
    if (editSession.White === "chessengine") {
      setWhiteID(
        chessengine_options.find(({ value }) => value === editSession.WhiteID)
      );
    } else if (editSession.White === "genai") {
      setWhiteID(
        modelOptions
          .map((e) => e.options)
          .flat()
          .find(({ value }) => value === editSession.WhiteID)
      );
    }

    if (editSession.Black === "chessengine") {
      setBlackID(
        chessengine_options.find(({ value }) => value === editSession.BlackID)
      );
    } else if (editSession.Black === "genai") {
      setBlackID(
        modelOptions
          .map((e) => e.options)
          .flat()
          .find(({ value }) => value === editSession.BlackID)
      );
    }
  }, []);

  const defaultModel = {
    label: "Claude V2",
    value: "anthropic.claude-v2",
  };

  const updateSession = async () => {
    try {
      await mutateAsync({
        sessionID: editSession.SessionID,
        white,
        whiteID: whiteID.value ?? whiteID,
        black,
        blackID: blackID.value ?? blackID,
      });

      setAlertStatus({
        visible: true,
        msg: "Record updated",
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
      setEditSession(null);
    }
  };

  return (
    <Modal
      onDismiss={() => setEditSession(null)}
      visible={editSession}
      footer={
        <Box float="right">
          <Button
            disabled={!!!whiteID || !!!blackID}
            loading={isPending}
            onClick={updateSession}
          >
            Update
          </Button>
        </Box>
      }
      header="New Session"
    >
      <SpaceBetween direction="vertical" size="l">
        <FormField label="Session ID">{editSession.SessionID}</FormField>
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
          chessengine_options={chessengine_options}
          llm_model_options={modelOptions}
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
          chessengine_options={chessengine_options}
          llm_model_options={modelOptions}
          isPending={isPending}
        />
      </SpaceBetween>
    </Modal>
  );
};

const SwitchInputField = ({
  field,
  selectKey,
  id,
  setId,
  chessengine_options,
  llm_model_options,
  isPending,
}) => {
  switch (selectKey) {
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
            disabled={isPending}
            selectedOption={id}
            onChange={({ detail }: any) => setId(detail.selectedOption)}
            options={llm_model_options}
          />
        </FormField>
      );
    }
    case "random": {
      return setId("random");
    }
    case "chessengine": {
      return (
        <FormField label={`Engine Level`}>
          <Select
            disabled={isPending}
            selectedOption={id}
            onChange={({ detail }: any) => setId(detail.selectedOption)}
            options={chessengine_options}
          />
        </FormField>
      );
    }
  }
};
