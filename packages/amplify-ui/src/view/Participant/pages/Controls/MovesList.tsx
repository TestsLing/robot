import { Spinner } from "@cloudscape-design/components";
import { Box, TableCell, TableRow, Chip } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { Ic } from "isepic-chess";
import { Chess } from "chess.js";
import { useQuery } from "@tanstack/react-query";
import { pick } from "lodash";

import Cookies from "universal-cookie";
import {
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageList,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import toast from "react-hot-toast";
const cookies = new Cookies(null, { path: "/" });
const SessionID = cookies.get("ChessReinvent2024SessionID");

const normalise = (val, max, min) => (val - min) / (max - min);

export const MovesList = ({ latestMove, winner, debug, setDebug }) => {
  const moves = useQuery({ queryKey: ["moves", SessionID] }) as any;

  const [board, setBoard] = useState(Ic.initBoard());
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(50);
  const [bestMove, setBestMove] = useState("");

  const [height, setHeight] = useState(0);
  const statBoxRef = useRef(null);
  useEffect(() => {
    if (statBoxRef.current?.clientHeight)
      setHeight(statBoxRef.current.clientHeight);
  }, []);
  window.addEventListener("resize", () => {
    if (statBoxRef.current?.clientHeight)
      setHeight(statBoxRef.current.clientHeight);
  });

  const getAwaitMove = () => {
    const isepic = Ic.initBoard({ fen: latestMove.Move });
    const isepicMove = isepic.playMove(latestMove.SuggestedMove);

    const chessjs = new Chess(latestMove.Move);
    const chessjsMove = chessjs.move(isepicMove.san);

    return JSON.stringify(chessjsMove, null, 4);
  };

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

  useEffect(() => {
    const stockfish = new Worker("/stockfish-nnue-16-single.js");
    stockfish.postMessage("uci");
    stockfish.postMessage("ucinewgame");
    stockfish.postMessage("setoption name MultiPV value 3");
    stockfish.postMessage(`position fen ${latestMove.Move}`);
    stockfish.postMessage(`go depth ${1}`);

    stockfish.onmessage = ({ data }) => {
      if (data.startsWith(`info depth`)) {
        let message = data.split(" ");
        let index = 0;
        let movesIndex = 0;
        let moves = [];
        let evalutaion = "0";

        for (let i = 0; i < message.length; i++) {
          if (message[i] === "multipv") {
            index = parseInt(message[i + 1]) - 1;
          }

          if (
            message[i] === "score" &&
            message[i + 1] === "cp" &&
            index === 0
          ) {
            evalutaion = message[i + 2];
            convertEvaluation(evalutaion);
          } else if (message[i] === "score" && index === 0) {
            evalutaion = "M" + message[i + 2];
            convertEvaluation(evalutaion);
          }

          if (message[i] === "pv") {
            movesIndex = i + 1;
            break;
          }
        }

        for (let i = movesIndex; i < message.length; i++) {
          if (message[i] === "bmc") break;
          moves.push(message[i]);
        }
      }

      if (data.startsWith("bestmove")) {
        const message = data.split(" ");
        setBestMove(message[1]);
      }
    };
  }, [latestMove.Move]);

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

  const convertEvaluation = (ev) => {
    const chess = new Chess(latestMove.Move);

    const turn = chess.turn();

    if (ev === "M0") {
      if (winner === "White") {
        setEvaluation(100);
      } else if (winner === "Black") {
        setEvaluation(0);
      } else {
        setEvaluation(50);
      }
    } else if (turn === "b") {
      setEvaluation(normalise(parseInt(ev), -7000, 7000) * 100);
    } else if (turn === "w") {
      setEvaluation(100 - normalise(parseInt(ev), -7000, 7000) * 100);
    }

    return ev;
  };

  return (
    <MainContainer
      style={{
        height: "88dvh",
        borderRadius: "10px",
      }}
    >
      <ChatContainer>
        <ConversationHeader>
          <ConversationHeader.Content
            userName="Moves"
            info={indicatorStatus(latestMove)}
          />
        </ConversationHeader>
        <MessageList
          typingIndicator={
            (latestMove.TaskToken || latestMove.SfnExecutionId) && (
              <TypingIndicator content={indicatorStatus(latestMove)} />
            )
          }
        >
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
          {latestMove.TaskToken && (
            <Message
              className="awaiting-move-div"
              model={{
                message: getAwaitMove(),
                position: "single",
                direction: board.activeColor === "w" ? "outgoing" : "incoming",
              }}
            />
          )}
        </MessageList>
      </ChatContainer>
    </MainContainer>
  );
};
