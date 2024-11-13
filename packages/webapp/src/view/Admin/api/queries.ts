import {
  listActiveSessions,
  listGamesByMoveCount,
} from "../../../graphql/queries";

import { generateClient } from "aws-amplify/api";
import { useQuery } from "@tanstack/react-query";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  BedrockClient,
  ListFoundationModelsCommand,
  ListImportedModelsCommand,
} from "@aws-sdk/client-bedrock";

const client = generateClient();

// listActiveSessions
export const useListActiveSessions = () => {
  return useQuery({
    queryKey: ["listActiveSessions"],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: listActiveSessions,
      });

      return data.listActiveSessions;
    },
  });
};

// listGamesByMoveCount
export const useGamesByMoveCount = () => {
  return useQuery({
    queryKey: ["listGamesByMoveCount"],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: listGamesByMoveCount,
      });

      return data.listGamesByMoveCount;
    },
  });
};

// listFoundationModels
export const useListFoundationModels = () => {
  return useQuery({
    queryKey: ["useListFoundationModels"],
    queryFn: async () => {
      const { credentials } = await fetchAuthSession();

      const bedrockClient = new BedrockClient({
        region: import.meta.env.VITE_REGION,
        credentials,
      });

      const { modelSummaries } = await bedrockClient.send(
        new ListFoundationModelsCommand({
          byInferenceType: "ON_DEMAND",
          byOutputModality: "TEXT",
        })
      );

      return modelSummaries;
    },
  });
};

// listFoundationModels
export const useListImportedModels = () => {
  return useQuery({
    queryKey: ["useListImportedModels"],
    queryFn: async () => {
      const { credentials } = await fetchAuthSession();

      const bedrockClient = new BedrockClient({
        region: import.meta.env.VITE_REGION,
        credentials,
      });

      const { modelSummaries } = await bedrockClient.send(
        new ListImportedModelsCommand()
      );

      return modelSummaries;
    },
  });
};
