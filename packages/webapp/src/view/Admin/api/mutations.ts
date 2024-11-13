import {
  createSession,
  deleteSession,
  updateGameStatus,
  updateSession,
} from "../../../graphql/mutations";

import { generateClient } from "aws-amplify/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getLatestMove, getSession } from "../../../graphql/queries";

const client = generateClient();

// createSession
export const useCreateSession = () => {
  return useMutation({
    mutationKey: ["createSession"],
    mutationFn: async ({ sessionID, white, whiteID, black, blackID }: any) => {
      const { data } = await client.graphql({
        query: createSession,
        variables: {
          input: {
            SessionID: sessionID,
            White: white,
            WhiteID: whiteID,
            Black: black,
            BlackID: blackID,
          },
        },
      });

      return data.createSession;
    },
  });
};

// updateSession
export const useUpdateSession = () => {
  return useMutation({
    mutationKey: ["updateSession"],
    mutationFn: async ({ sessionID, white, whiteID, black, blackID }: any) => {
      const { data } = await client.graphql({
        query: updateSession,
        variables: {
          input: {
            SessionID: sessionID,
            White: white,
            WhiteID: whiteID,
            Black: black,
            BlackID: blackID,
          },
        },
      });

      return data.updateSession;
    },
  });
};

// getSession
export const useGetSession = () => {
  return useMutation({
    mutationKey: ["getSession"],
    mutationFn: async ({ SessionID }: any) => {
      const { data } = await client.graphql({
        query: getSession,
        variables: { SessionID },
      });

      return data.getSession;
    },
  });
};

// updateGameStatus
export const useUpdateGameStatus = () => {
  return useMutation({
    mutationKey: ["updateGameStatus"],
    mutationFn: async ({ SessionID, GameStatus }: any) => {
      const { data } = await client.graphql({
        query: updateGameStatus,
        variables: {
          input: { SessionID, GameStatus },
        },
      });

      return data.updateGameStatus;
    },
  });
};

// deleteSession
export const useDeleteSession = () => {
  return useMutation({
    mutationKey: ["deleteSession"],
    mutationFn: async ({ sessionID }: any) => {
      const { data } = await client.graphql({
        query: deleteSession,
        variables: {
          input: { SessionID: sessionID },
        },
      });

      return data.deleteSession;
    },
  });
};

// getLatestMove
export const useGetLatestMove = (SessionID: string) => {
  return useQuery({
    queryKey: ["latestMove", SessionID],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: getLatestMove,
        variables: { SessionID },
      });

      return data.getLatestMove;
    },
  });
};
