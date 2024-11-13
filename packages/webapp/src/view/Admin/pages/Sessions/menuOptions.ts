import { FoundationModelSummary } from "@aws-sdk/client-bedrock";
import { groupBy } from "lodash";

export const modelOptions = [
  {
    label: "Amazon",
    options: [
      {
        label: "Titan Text G1 - Express",
        value: "amazon.titan-text-express-v1",
      },
      {
        label: "Titan Text G1 - Lite",
        value: "amazon.titan-text-lite-v1",
      },
    ],
  },
  {
    label: "Anthropic",
    options: [
      {
        label: "Claude Instant",
        value: "anthropic.claude-instant-v1",
      },
      {
        label: "Claude 2",
        value: "anthropic.claude-v2",
      },
      {
        label: "Claude 2.1",
        value: "anthropic.claude-v2:1",
      },
      {
        label: "Claude 3 Haiku",
        value: "anthropic.claude-3-haiku-20240307-v1:0",
      },
      {
        label: "Claude 3 Sonnet",
        value: "anthropic.claude-3-sonnet-20240229-v1:0",
      },
    ],
  },
  {
    label: "AI21 Labs",
    options: [
      {
        label: "Jurassic-2 Mid",
        value: "ai21.j2-mid-v1",
      },
      {
        label: "Jurassic-2 Ultra",
        value: "ai21.j2-ultra-v1",
      },
    ],
  },
  {
    label: "Cohere",
    options: [
      {
        label: "Command",
        value: "cohere.command-text-v14",
      },
      {
        label: "Command Light",
        value: "cohere.command-light-text-v14",
      },
    ],
  },
  {
    label: "Meta",
    options: [
      {
        label: "Llama 2 Chat 13B",
        value: "meta.llama2-13b-chat-v1",
      },
      {
        label: "Llama 2 Chat 70B",
        value: "meta.llama2-70b-chat-v1",
      },
    ],
  },
  {
    label: "Mistral AI",
    options: [
      {
        label: "Mistral 7B Instruct",
        value: "mistral.mistral-7b-instruct-v0:2",
      },
      {
        label: "Mixtral 8X7B Instruct",
        value: "mistral.mixtral-8x7b-instruct-v0:1",
      },
    ],
  },
];

export const gameOptions = [
  { label: "Player", value: "player" },
  { label: "Bedrock (Base Models)", value: "bedrock" },
  { label: "Bedrock (Imported Models)", value: "imported" },
  { label: "Chess Engine", value: "chessengine" },
  { label: "Random", value: "random" },
];

export const chessEngineOptions = [
  { label: "Beginner", value: "ChessEngine-0" },
  { label: "Intermediate", value: "ChessEngine-1" },
  { label: "Advanced", value: "ChessEngine-2" },
];

export const transformModelOptions = (data: FoundationModelSummary[]) => {
  const grouped = groupBy(data, "providerName");

  const modelList = Object.entries(grouped).map(([providerName, models]) => ({
    label: providerName,
    options: models.map((model) => ({
      label: model.modelName,
      value: model.modelId,
    })),
  }));

  return modelList;
};
