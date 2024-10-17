import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getLatestMove,
  getSession,
  listActiveSessions,
  listGamesByMoveCount,
} from "../../../graphql/queries";
import {
  createSession,
  deleteSession,
  updateGameStatus,
  updateSession,
} from "../../../graphql/mutations";
import { generateClient } from "aws-amplify/api";

const client = generateClient();

//
////// Queries //////
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

//
////// Mutations //////
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
