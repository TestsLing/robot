import { generateClient } from "aws-amplify/api";
import { useQuery } from "@tanstack/react-query";
import {
  getLatestMove,
  getMoves,
  getSession,
  listComments,
} from "../../../graphql/queries";

const client = generateClient();

// getSession
export const useGetSession = (SessionID: string) => {
  return useQuery({
    queryKey: ["session", SessionID],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: getSession,
        variables: { SessionID },
      });

      return data.getSession;
    },
  });
};

// getMoves
export const useGetMoves = (SessionID: string) => {
  return useQuery({
    queryKey: ["moves", SessionID],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: getMoves,
        variables: { SessionID },
      });

      return data.getMoves;
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

// listComments
export const useListComments = (SessionID: string) => {
  return useQuery({
    queryKey: ["listComments", SessionID],
    queryFn: async () => {
      const { data } = await client.graphql({
        query: listComments,
        variables: { SessionID },
      });

      return data.listComments;
    },
  });
};
