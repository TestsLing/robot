import { useAtom } from "jotai";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { toastAtom } from "../../common/atom";
import { useQuery } from "@tanstack/react-query";
import { generateClient } from "aws-amplify/api";
import { Spinner } from "@cloudscape-design/components";
import { useGetLatestMove, useGetMoves, useListComments } from "./api/api";
import {
  onCreateComment,
  onPostQuestion,
  onUpdateLatestMove,
} from "../../graphql/subscriptions";

import Cookies from "universal-cookie";

const cookies = new Cookies(null, { path: "/" });
const SessionID = cookies.get("ChessReinvent2024SessionID");

export const PlayerOutlet = () => {
  const moves = useGetMoves(SessionID);
  const comments = useListComments(SessionID);
  const latestMove = useGetLatestMove(SessionID);
  const session = useQuery({ queryKey: ["session", SessionID] }) as any;

  const [, setToast] = useAtom(toastAtom);

  // If session was to change, get moves
  useEffect(() => {
    moves.refetch();
    latestMove.refetch();
  }, [session.dataUpdatedAt]);

  // If errors are captured from moves
  useEffect(() => {
    if (moves.error) {
      setToast(JSON.stringify((moves.error as any)?.errors[0].message));
    }
    if (latestMove.error) {
      setToast(JSON.stringify((moves.error as any)?.errors[0].message));
    }
  }, [moves.error, latestMove.error]);

  return moves.isLoading || latestMove.isLoading ? (
    // If getting moves load
    <Spinner />
  ) : !!moves.data && !!latestMove.data ? (
    // Only when data is valid do we render
    <>
      <Outlet />
      <PageSubscriptions
        comments={comments}
        movesRefetch={moves.refetch}
        latestMovesRefetch={latestMove.refetch}
        latestMove={latestMove}
      />
    </>
  ) : (
    <p>Error in retrieving moves.data && latestMove.data</p>
  );
};

const PageSubscriptions = ({
  comments,
  movesRefetch,
  latestMovesRefetch,
  latestMove,
}) => {
  const client = generateClient();

  useEffect(() => {
    const newMoveMade = client
      .graphql({ query: onUpdateLatestMove, variables: { SessionID } })
      .subscribe({
        next: ({ data }) => {
          const updatedMove = data.onUpdateLatestMove;

          if (updatedMove.SfnExecutionId !== latestMove.data.SfnExecutionId) {
            latestMovesRefetch();
          }

          if (updatedMove.Move !== latestMove.data.Move) {
            movesRefetch();
            latestMovesRefetch();
          }
        },
      });

    const createComment = client
      .graphql({ query: onCreateComment, variables: { SessionID } })
      .subscribe({ next: () => comments.refetch() });

    const postQuestion = client
      .graphql({ query: onPostQuestion, variables: { SessionID } })
      .subscribe({ next: () => comments.refetch() });

    return () => {
      newMoveMade.unsubscribe();
      createComment.unsubscribe();
      postQuestion.unsubscribe();
    };
  }, []);

  return null;
};
