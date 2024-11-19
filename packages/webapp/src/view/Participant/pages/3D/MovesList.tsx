import { Ic } from "isepic-chess";
import { useEffect, useState } from "react";
import { TableRow, TableCell } from "@mui/material";
import {
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageList,
} from "@chatscope/chat-ui-kit-react";
import { useCookies } from "react-cookie";
import { useGetMoves } from "../../api/queries";

export const MovesList = () => {
  const [cookies] = useCookies();

  const [board, setBoard] = useState(Ic.initBoard());
  const [_, setError] = useState(null);
  const moves = useGetMoves(cookies.GenAIChessDemoSessionID);

  useEffect(() => {
    const tempBoard = Ic.initBoard(moves.data[0].Move);

    const justMoves = moves.data
      .reverse()
      .slice(1)
      .map(({ Move }) => Move);

    if (justMoves.length) {
      const moved = tempBoard.playMoves(justMoves);
      if (!moved) {
        setError("Moves out of Sync");
      } else {
        setError(null);
        setBoard(tempBoard);
      }
    }
  }, [moves.dataUpdatedAt]);

  return (
    <MainContainer
      style={{
        borderRadius: "10px",
      }}
    >
      <ChatContainer>
        <ConversationHeader>
          <ConversationHeader.Content userName="Moves" />
        </ConversationHeader>
        <MessageList>
          {board.moveList.slice(1).map((x, i: number) => {
            return (
              <Message
                key={i}
                model={{
                  position: "single",
                  message: x.san,
                  direction: x.colorMoved === "w" ? "outgoing" : "incoming",
                }}
              >
                <TableRow key={i}>
                  <TableCell sx={{ color: "rgb(145,145,145)" }}>
                    {board.moveList.length - i - 1}.
                  </TableCell>
                  <TableCell sx={{ color: "rgb(193,193,193)" }}>
                    {x.colorMoved}
                  </TableCell>
                  <TableCell sx={{ color: "rgb(193,193,193)" }}>
                    {x.fromBos}
                  </TableCell>
                  <TableCell sx={{ color: "rgb(193,193,193)" }}>
                    {x.toBos}
                  </TableCell>
                </TableRow>
              </Message>
            );
          })}
        </MessageList>
      </ChatContainer>
    </MainContainer>
  );
};
