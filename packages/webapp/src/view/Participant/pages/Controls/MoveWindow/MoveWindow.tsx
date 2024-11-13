import {
  ChatContainer,
  MessageList,
  Message,
} from "@chatscope/chat-ui-kit-react";

import { Button, Header, Spinner } from "@cloudscape-design/components";
import { BoardItem } from "@cloudscape-design/board-components";
import { useGetMoves } from "../../../api/queries";
import { Chessboard } from "react-chessboard";
import { Box, Chip } from "@mui/material";
import { useCookies } from "react-cookie";
import { useEffect, useRef, useState } from "react";

export const MoveWindow = ({ latestMove, winner }) => {
  const [cookies] = useCookies(["GenAIChessDemoSessionID"]);
  const moves = useGetMoves(cookies.GenAIChessDemoSessionID);

  const indicatorStatus = (latestMove: {
    TaskToken: string;
    SfnExecutionId: string;
  }) => {
    if (winner) {
      return (
        <Box display={"flex"} justifyContent={"center"} gap={1.5}>
          🎉 <Chip size="small" label={winner} color="info" /> 🎉
        </Box>
      );
    } else if (latestMove.TaskToken) {
      return <>🦾 - Awaiting Movement</>;
    } else if (latestMove.SfnExecutionId) {
      return <>🤔 - Model Thinking</>;
    } else if (moves.isRefetching) {
      return (
        <>
          <Spinner /> - Fetching
        </>
      );
    } else {
      return <>😐 Idle</>;
    }
  };

  useEffect(() => {
    moves.refetch();
  }, [latestMove]);

  //  Chess Board
  const boardDivRef = useRef(null);
  const [boardDiv, setBoardDiv] = useState(200);
  useEffect(() => {
    const { current } = boardDivRef;

    if (current?.offsetWidth) setBoardDiv(current?.offsetWidth);
  }, [boardDivRef.current?.clientHeight, boardDivRef.current?.offsetWidth]);

  return (
    <BoardItem
      header={
        <Header
          actions={
            <Button variant="primary">{indicatorStatus(latestMove)}</Button>
          }
        >
          Moves
        </Header>
      }
      disableContentPaddings
      i18nStrings={{
        dragHandleAriaLabel: "Drag handle",
        resizeHandleAriaLabel: "Resize handle",
      }}
    >
      <ChatContainer>
        <MessageList>
          {moves.data.slice(-10).map(({ Move }) => {
            const colour = Move.split(" ")[1];

            return (
              <div ref={boardDivRef}>
                <Message
                  key={Move}
                  model={{
                    position: "single",
                    direction: colour === "b" ? "outgoing" : "incoming",
                    type: "custom",
                  }}
                >
                  <Message.CustomContent>
                    <Chessboard
                      key={Move}
                      position={Move}
                      boardWidth={boardDiv - 150}
                      arePiecesDraggable={false}
                    />
                    {colour === "b" ? "White" : "Black"}
                  </Message.CustomContent>
                </Message>
              </div>
            );
          })}
        </MessageList>
      </ChatContainer>
    </BoardItem>
  );
};
