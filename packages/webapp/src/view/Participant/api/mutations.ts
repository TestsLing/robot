import { useMutation } from "@tanstack/react-query";

import {
  commentatorQuestion,
  humanNewMove,
  postQuestion,
  verifySession,
} from "../../../graphql/mutations";
import { generateClient } from "aws-amplify/api";

const client = generateClient();

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
      ModelID,
    }: {
      Comment: string;
      Author: string;
      Board: string;
      ModelID: string;
    }) => {
      const { data } = await client.graphql({
        query: postQuestion,
        variables: { SessionID, Comment, Author, Board, ModelID },
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
      ModelID,
    }: {
      History: any[];
      Comment: string;
      Board: string;
      ModelID: string;
    }) => {
      const { data } = await client.graphql({
        query: commentatorQuestion,
        variables: {
          History: JSON.stringify(History),
          SessionID,
          Comment,
          Board,
          ModelID,
        },
      });

      return data.commentatorQuestion;
    },
  });
};
