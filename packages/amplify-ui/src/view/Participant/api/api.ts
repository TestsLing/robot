import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getLatestMove,
  getMoves,
  getSession,
  listComments,
} from "../../../graphql/queries";
import {
  commentatorQuestion,
  humanNewMove,
  postQuestion,
  verifySession,
} from "../../../graphql/mutations";
import { generateClient } from "aws-amplify/api";

const client = generateClient();

////// Queries //////

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

////// Mutations //////
// verifySession
export const useVerifySession = () => {
  return useMutation({
    mutationKey: ["verifySession"],
    mutationFn: async ({ sessionInput }: any) => {
      const { data } = await client.graphql({
        query: verifySession,
        variables: { SessionID: sessionInput },
      });

      return data.verifySession;
    },
  });
};

// humanNewMove
export const useHumanNewMove = () => {
  return useMutation({
    mutationKey: ["humanNewMove"],
    mutationFn: async ({ SessionID, Action, Move }: any) => {
      const { data } = await client.graphql({
        query: humanNewMove,
        variables: { input: { SessionID, Action, Move } },
      });

      return data.humanNewMove;
    },
  });
};

// postQuestion
export const usePostQuestion = (SessionID: string) => {
  return useMutation({
    mutationKey: ["postQuestion"],
    mutationFn: async ({
      Comment,
      Author,
      Board,
      Model,
    }: {
      Comment: string;
      Author: string;
      Board: string;
      Model: string;
    }) => {
      const { data } = await client.graphql({
        query: postQuestion,
        variables: { SessionID, Comment, Author, Board, Model },
      });

      return data.postQuestion;
    },
  });
};

// commentatorQuestion
export const useCommentatorQuestion = (SessionID: string) => {
  return useMutation({
    mutationKey: ["commentatorQuestion"],
    mutationFn: async ({
      History,
      Comment,
      Board,
      Model,
    }: {
      History: any[];
      Comment: string;
      Board: string;
      Model: string;
    }) => {
      const { data } = await client.graphql({
        query: commentatorQuestion,
        variables: {
          History: JSON.stringify(History),
          SessionID,
          Comment,
          Board,
          Model,
        },
      });

      return data.commentatorQuestion;
    },
  });
};
