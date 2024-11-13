import {
  Modal,
  Box,
  SpaceBetween,
  FormField,
  Button,
  Input,
  Select,
  KeyValuePairs,
  Container,
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

import { useCreateSession } from "../../api/mutations";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import { capitalize } from "lodash";

interface ICreateSession {
  createSession: boolean;
  setCreateSession: Function;
  setAlertStatus: Function;
}

export const CreateSession = ({
  createSession,
  setCreateSession,
  setAlertStatus,
}: ICreateSession) => {
  const { handleSubmit, control, watch, resetField, reset } = useForm();
  const { mutateAsync, isPending } = useCreateSession();

  const sessionID = watch("sessionID");

  const onSubmit = async (data: any) => {
    const { white, black } = data;

    try {
      await mutateAsync({
        sessionID,
        white: white.option.value,
        whiteID: white.id?.value ?? white.id,
        black: black.option.value,
        blackID: black.id?.value ?? black.id,
      });
      setAlertStatus({
        visible: true,
        msg: (
          <span>
            Session Created: <b>{sessionID}</b>
          </span>
        ),
        type: "success",
      });
      reset();
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
    <form onSubmit={handleSubmit(onSubmit)}>
      {createSession && (
        <Modal
          size="large"
          onDismiss={() => setCreateSession(false)}
          visible={createSession}
          footer={
            <Box float="right">
              <Button
                variant="primary"
                loading={isPending}
                onClick={() => handleSubmit(onSubmit)()}
              >
                Create
              </Button>
            </Box>
          }
          header="New Session"
        >
          <SpaceBetween direction="vertical" size="l">
            <Controller
              name="sessionID"
              control={control}
              rules={{
                required: true,
              }}
              render={({
                field: { onChange, value },
                fieldState: { invalid },
              }) => (
                <FormField
                  label="Session ID*"
                  errorText={invalid && "Required"}
                  stretch
                >
                  <Input
                    value={value}
                    disabled={isPending}
                    placeholder="Enter a session ID..."
                    onChange={({ detail }) => onChange(detail.value)}
                    invalid={invalid}
                  />
                </FormField>
              )}
            />
            <PlayerConfiguration
              field={"black"}
              isPending={isPending}
              useForm={{ watch, control, isPending, resetField }}
            />

            <PlayerConfiguration
              field={"white"}
              isPending={isPending}
              useForm={{ watch, control, isPending, resetField }}
            />
          </SpaceBetween>
        </Modal>
      )}
    </form>
  );
};

interface IPlayerConfiguration {
  field: string;
  isPending: boolean;
  useForm: any;
}

const PlayerConfiguration = ({
  field,
  isPending,
  useForm,
}: IPlayerConfiguration) => {
  const { watch, resetField, control } = useForm;
  const option = watch(`${field}.option`);
  const foundationModels = useListFoundationModels();
  const importedModels = useListImportedModels();

  useEffect(() => {
    switch (option?.value) {
      case "player":
        return resetField(`${field}.id`, { defaultValue: "" });
      case "bedrock":
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
        return resetField(`${field}.id`, {
          defaultValue: chessEngineOptions[0],
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
