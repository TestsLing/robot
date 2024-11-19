import {
  Modal,
  Box,
  SpaceBetween,
  FormField,
  SegmentedControl,
  Button,
  Input,
  Select,
  Container,
  KeyValuePairs,
} from "@cloudscape-design/components";

import {
  useListFoundationModels,
  useListImportedModels,
} from "../../api/queries";

import {
  chessEngineOptions,
  gameOptions,
  transformModelOptions,
} from "./menuOptions";

import { useUpdateSession } from "../../api/mutations";
import { Controller, useForm } from "react-hook-form";
import { capitalize } from "lodash";
import { useEffect } from "react";

interface IEditSession {
  editSession: any;
  setEditSession: Function;
  setAlertStatus: Function;
}

export const EditSession = ({
  editSession,
  setEditSession,
  setAlertStatus,
}: IEditSession) => {
  console.log(editSession);

  const { handleSubmit, control, watch, resetField } = useForm();
  const { mutateAsync, isPending } = useUpdateSession();

  const onSubmit = async (data: any) => {
    const { white, black } = data;

    try {
      await mutateAsync({
        sessionID: editSession.SessionID,
        white: white.option,
        whiteID: white.id?.value ?? white.id,
        black: black.option,
        blackID: black.id?.value ?? black.id,
      });
      setAlertStatus({
        visible: true,
        msg: (
          <span>
            Session Updated: <b>{editSession.SessionID}</b>
          </span>
        ),
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Modal
        onDismiss={() => setEditSession(null)}
        visible={editSession}
        footer={
          <Box float="right">
            <Button
              loading={isPending}
              onClick={() => handleSubmit(onSubmit)()}
            >
              Update
            </Button>
          </Box>
        }
        header="Session Editor"
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField label="Session ID">{editSession.SessionID}</FormField>

          <PlayerConfiguration
            field={"black"}
            isPending={isPending}
            editSession={editSession}
            useForm={{ watch, control, isPending, resetField }}
          />

          <PlayerConfiguration
            field={"white"}
            isPending={isPending}
            editSession={editSession}
            useForm={{ watch, control, isPending, resetField }}
          />
        </SpaceBetween>
      </Modal>
    </form>
  );
};

interface IPlayerConfiguration {
  field: string;
  isPending: boolean;
  editSession: any;
  useForm: any;
}

const PlayerConfiguration = ({
  field,
  useForm,
  isPending,
  editSession,
}: IPlayerConfiguration) => {
  const { watch, resetField, control } = useForm;
  const option = watch(`${field}.option`);
  const foundationModels = useListFoundationModels();
  const importedModels = useListImportedModels();

  console.log(editSession);
  console.log(field);

  useEffect(() => {
    switch (option?.value) {
      case "player":
        if (editSession[capitalize(field)] === "player")
          return resetField(`${field}.id`, {
            defaultValue: editSession.WhiteID,
          });
        return resetField(`${field}.id`, { defaultValue: "" });
      case "bedrock":
        if (editSession[capitalize(field)] === "bedrock") {
          const modelRecord = foundationModels.data.find((item) => {
            return item.modelId === editSession[`${capitalize(field)}ID`];
          });
          return resetField(`${field}.id`, {
            defaultValue: {
              label: modelRecord.modelName,
              value: modelRecord.modelId,
            },
          });
        }
        return resetField(`${field}.id`, {
          defaultValue: {
            label: foundationModels.data?.[0].modelName,
            value: foundationModels.data?.[0].modelId,
          },
        });
      case "imported":
        return (
          importedModels.data &&
          resetField(`${field}.id`, {
            defaultValue: {
              label: importedModels.data?.[0].modelName,
              value: importedModels.data?.[0].modelArn,
            },
          })
        );
      case "chessengine":
        if (editSession[capitalize(field)] === "chessengine")
          return resetField(`${field}.id`, {
            defaultValue: chessEngineOptions.find(
              (item) => item.value === editSession[`${capitalize(field)}ID`]
            ),
          });
        return resetField(`${field}.id`, {
          defaultValue: { label: "Advanced", value: "ChessEngine-2" },
        });
      default:
        resetField(`${field}.id`, { defaultValue: "random" });
    }
  }, [option, field]);

  return (
    <FormField label={capitalize(field)} stretch>
      <Container>
        <KeyValuePairs
          columns={2}
          items={(() => {
            const game = [
              {
                label: null,
                value: (
                  <Controller
                    name={`${field}.option`}
                    defaultValue={gameOptions[0]}
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <FormField label="Type">
                        <Select
                          selectedOption={value}
                          onChange={({ detail }) =>
                            onChange(detail.selectedOption)
                          }
                          options={gameOptions}
                        />
                      </FormField>
                    )}
                  />
                ),
              },
            ];

            switch (option?.value) {
              case "player":
                return [
                  ...game,
                  {
                    label: null,
                    value: (
                      <Controller
                        name={`${field}.id`}
                        control={control}
                        rules={{
                          required: true,
                        }}
                        render={({
                          field: { onChange, value },
                          fieldState: { invalid },
                        }) => (
                          <FormField
                            label="Username*"
                            errorText={invalid && "Required"}
                          >
                            <Input
                              disabled={isPending}
                              value={value}
                              placeholder="Player email..."
                              onChange={({ detail }) => onChange(detail.value)}
                              invalid={invalid}
                            />
                          </FormField>
                        )}
                      />
                    ),
                  },
                ];
              case "bedrock":
                return [
                  ...game,
                  {
                    label: null,
                    value: (
                      <FormField label={"Model"}>
                        <Controller
                          name={`${field}.id`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              filteringType="auto"
                              selectedOption={value}
                              onChange={({ detail }: any) =>
                                onChange(detail.selectedOption)
                              }
                              statusType={
                                foundationModels.isLoading
                                  ? "loading"
                                  : "finished"
                              }
                              options={transformModelOptions(
                                foundationModels.data
                              )}
                              loadingText="Loading models"
                            />
                          )}
                        />
                      </FormField>
                    ),
                  },
                ];
              case "imported":
                return [
                  ...game,
                  {
                    label: null,
                    value: (
                      <FormField label={"Imported Model"}>
                        <Controller
                          name={`${field}.id`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              selectedOption={value}
                              onChange={({ detail }: any) =>
                                onChange(detail.selectedOption)
                              }
                              statusType={
                                foundationModels.isLoading
                                  ? "loading"
                                  : "finished"
                              }
                              options={importedModels.data.map(
                                ({ modelName, modelArn }) => {
                                  return { label: modelName, value: modelArn };
                                }
                              )}
                              loadingText="Loading imported models"
                              empty={"No imported models found"}
                            />
                          )}
                        />
                      </FormField>
                    ),
                  },
                ];
              case "chessengine":
                return [
                  ...game,
                  {
                    label: null,
                    value: (
                      <FormField label={"Engine Level"}>
                        <Controller
                          name={`${field}.id`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              selectedOption={value}
                              onChange={({ detail }: any) =>
                                onChange(detail.selectedOption)
                              }
                              options={chessEngineOptions}
                            />
                          )}
                        />
                      </FormField>
                    ),
                  },
                ];
              default:
                return game;
            }
          })()}
        />
      </Container>
    </FormField>
  );
};
