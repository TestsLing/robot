import { Ic } from "isepic-chess";
import { SQUARES, Square } from "chess.js";
import { useEffect, useState } from "react";
import { useHumanNewMove } from "../../api/api";
import { Chessboard } from "react-chessboard";
import { useQuery } from "@tanstack/react-query";
import { MovesList } from "./MovesList";
import { generateClient } from "aws-amplify/api";
import { ChatWindow } from "./ChatWindow";
import { IAlertStatus } from "../../../../common/types";
import { fetchUserAttributes } from "aws-amplify/auth";
import { Avatar, Box, Chip, Grid, Typography } from "@mui/material";
import { onSendError } from "../../../../graphql/subscriptions";
import {
  Alert,
  Modal,
  Button as CButton,
  SpaceBetween,
} from "@cloudscape-design/components";

import Cookies from "universal-cookie";

import "./Control.css";

const cookies = new Cookies(null, { path: "/" });
const SessionID = cookies.get("ChessReinvent2024SessionID");

export const Controls = () => {
  // Control States
  const [email, setEmail] = useState("");
  const [board] = useState(Ic.initBoard());
  const [debug, setDebug] = useState(false);
  const [modal, setModal] = useState(false);
  const [winner, setWinner] = useState(null);
  const [toSq, setToSq] = useState<Square>(null);
  const [highlights, setHighlights] = useState({});
  const [fromSq, setFromSq] = useState<Square>(null);
  const [showPossibleMoves, setShowPossibleMoves] = useState([]);
  const [lastPieceSelected, setLastPieceSelected] = useState(null);
  const [alertStatus, setAlertStatus] = useState<IAlertStatus>({
    visible: false,
    msg: "",
    type: "info",
  });

  // Control Queries
  const session = useQuery({ queryKey: ["session", SessionID] }) as any;
  const latestMove = useQuery({ queryKey: ["latestMove", SessionID] }) as any;
  const comments = useQuery({ queryKey: ["listComments", SessionID] }) as any;

  const { mutateAsync } = useHumanNewMove();

  useEffect(() => {
    (async () => {
      const { email } = await fetchUserAttributes();
      setEmail(email);
    })();
  }, []);

  /* 
    Step 0: Using moves set up the board, this will change as moves are received
  */
  useEffect(() => {
    if (latestMove.data.Move) {
      board.loadFen(latestMove.data.Move);
    }
  }, [latestMove.data.Move]);

  // If LatestMove updates
  useEffect(() => {
    const { GameWinner, SfnExecutionId, TaskToken } = latestMove.data;

    if (GameWinner) {
      switch (GameWinner) {
        case "w":
          setWinner("White");
          break;
        case "b":
          setWinner("Black");
          break;
        default:
          setWinner("Draw");
      }
    }

    if (!!GameWinner || (!SfnExecutionId && !TaskToken)) {
      setToSq(null);
      setFromSq(null);
      setShowPossibleMoves([]);
    }
  }, [latestMove.data]);

  // Limit possible moves to which side you are allowed to
  useEffect(() => {
    (async () => {
      const { WhiteID, BlackID } = session.data;

      // If the piece is white
      if (lastPieceSelected?.[0] === "w") {
        // Only grant if you are in fact the white player ID
        WhiteID === email
          ? setShowPossibleMoves(board.legalMoves(fromSq))
          : setShowPossibleMoves([]);
      } else {
        // Otherwise it's a black piece, likewise only grant if you are the black player ID
        BlackID === email
          ? setShowPossibleMoves(board.legalMoves(fromSq))
          : setShowPossibleMoves([]);
      }
    })();
  }, [fromSq, lastPieceSelected]);

  // Reactively highlight possible moves
  useEffect(() => {
    const styles = {};
    for (const sq of SQUARES) {
      if (showPossibleMoves.map((move) => move.slice(-2)).includes(sq)) {
        styles[sq] = {
          backgroundColor: "rgba(60,59,56,0.25)",
          borderRadius: "75px",
        };
      } else if (sq === fromSq) {
        styles[sq] = {
          backgroundColor: "rgba(255, 174, 66,.5)",
        };
      }
    }
    setHighlights(styles);
  }, [showPossibleMoves]);

  // If we select a toSq we need to submit that move
  useEffect(() => {
    // If we have a toSq submit
    if (toSq) {
      const styles = {};

      for (const square of SQUARES) {
        if ([fromSq, toSq].includes(square)) {
          styles[square] = {
            animation: "blinkingBackground 1s infinite alternate",
          };
        }
      }

      setHighlights(styles);
      submitMove();
    } else {
      // Otherwise clean all highlights on the board
      setHighlights({});
    }
  }, [toSq]);

  /* 
    Step 4: Continue game play until a winner is announced, then stop the game
  */
  useEffect(() => {
    if (winner) {
      setModal(true);
    }
  }, [winner]);

  const submitMove = async () => {
    const tempBoard = board.playMove(`${fromSq}-${toSq}`, {
      isMockMove: true,
    });

    try {
      await mutateAsync({
        SessionID,
        Action: "MOVE",
        Move: tempBoard.fen,
      });
    } catch ({ errors }) {
      setAlertStatus({
        msg: errors[0].message,
        type: "error",
        visible: true,
      });
      setToSq(null);

      throw new Error(JSON.stringify(errors[0], null, 2));
    }
  };

  return (
    <Box height={"100%"} display={"flex"} bgcolor={"rgb(7, 24, 54)"} px={3}>
      <Grid my={2} container columnSpacing={4}>
        {/* Chat Window */}
        <Grid item xs={4}>
          <ChatWindow
            comments={comments}
            activeColor={board.activeColor}
            board={board.fen}
          />
        </Grid>

        {/* ChessBoard */}
        <Grid item xs={5}>
          {debug && alertStatus.visible && (
            <Box mb={1.5}>
              <Alert
                type={"error"}
                dismissible
                onDismiss={() =>
                  setAlertStatus({ visible: false, msg: "", type: "error" })
                }
              >
                {alertStatus.msg}
              </Alert>
            </Box>
          )}
          {/* Black Player Bio */}
          <Box
            gap={1.5}
            height={"88dvh"}
            display={"flex"}
            justifyContent={"center"}
            flexDirection={"column"}
          >
            {/* Black Player Bio */}
            <Box display={"flex"}>
              <Avatar sx={{ borderRadius: "0.3rem" }} src="/character.jpg" />
              <Box ml={1.5} display={"flex"} gap={1}>
                <Typography
                  variant="subtitle2"
                  fontWeight={"600"}
                  color={"white"}
                >
                  {session.data.BlackID}
                </Typography>
                {/* If Black Won */}
                {winner === "Black" && (
                  <Chip
                    size="small"
                    sx={{ fontSize: "10px" }}
                    label={"Winner!!!"}
                    color="info"
                  />
                )}
                {/* If it's Black's turn */}
                {!winner && whosTurn(latestMove.data) === "b" && (
                  <Chip
                    size="small"
                    sx={{ fontSize: "10px" }}
                    label={"Black's Turn"}
                    color="primary"
                  />
                )}
              </Box>
            </Box>

            <Chessboard
              position={latestMove.data.Move}
              autoPromoteToQueen
              arePiecesDraggable={false}
              customSquareStyles={highlights}
              customDarkSquareStyle={{
                backgroundColor: "rgb(126, 152, 92)",
              }}
              customLightSquareStyle={{
                backgroundColor: "rgb(234, 237, 207)",
              }}
              customBoardStyle={{
                borderRadius: "5px",
              }}
              onSquareClick={(square) => {
                if (session.data.GameStatus !== "PLAYING" || !!winner) {
                  // If were not in status playing or there is a winner disable play
                  setFromSq(null);
                } else if (!toSq) {
                  if (showPossibleMoves.includes(square)) {
                    // Otherwise make the move
                    setToSq(square);
                  } else {
                    // When we select a square show it's possible moves
                    setFromSq(square);
                  }
                }
              }}
              onPieceClick={(piece) => {
                if (fromSq) {
                } else if (session.data.GameStatus === "PLAYING" && !winner) {
                  // We only do this if we are playing and no winner has been announced yet
                  setLastPieceSelected(piece);
                } else {
                  setLastPieceSelected(null);
                }
              }}
            />

            {/* White Player Bio */}
            <Box display={"flex"}>
              <Avatar sx={{ borderRadius: "0.3rem" }} src="/player.png" />
              <Box ml={1.5} display={"flex"} gap={1}>
                <Typography
                  variant="subtitle2"
                  fontWeight={"600"}
                  color={"white"}
                >
                  {session.data.WhiteID}
                </Typography>
                {/* If White Won!! */}
                {winner === "White" && (
                  <Chip
                    size="small"
                    sx={{ fontSize: "10px" }}
                    label={"Winner!!!"}
                    color="info"
                  />
                )}
                {/* If it's White's Turn */}
                {!winner && whosTurn(latestMove.data) === "w" && (
                  <Chip
                    size="small"
                    sx={{ fontSize: "10px" }}
                    label={"White's Turn"}
                    color="primary"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Move List */}
        <Grid item xs={3}>
          <MovesList
            latestMove={latestMove.data}
            winner={winner}
            debug={debug}
            setDebug={setDebug}
          />
        </Grid>
      </Grid>

      <WinnerModal
        modal={modal}
        setModal={setModal}
        session={session}
        winner={winner}
      />
      <PageSubscriptions
        onError={({ Error, Cause }) => {
          setAlertStatus({
            msg: JSON.stringify({ Error, Cause }),
            type: "error",
            visible: true,
          });

          setToSq(null);
          setFromSq(null);
          setShowPossibleMoves([]);
        }}
      />
    </Box>
  );
};

const whosTurn = ({ Move }) => {
  const turn = Move?.split(" ")[1];
  return turn;
};

const WinnerModal = ({ modal, setModal, session, winner }) => {
  const player = session.data[winner ? "WhiteID" : "BlackID"];

  return (
    <Modal
      onDismiss={() => setModal(false)}
      visible={modal}
      footer={
        <CButton variant="primary" onClick={() => setModal(false)}>
          {winner === "Draw" ? "Okay..." : "Woohoo!"}
        </CButton>
      }
      header={
        winner === "Draw"
          ? "😐 The Game has Ended in a Draw 🤨"
          : "🎉 Winner Winner, Chicken Dinner 🎉"
      }
    >
      <Box display={"flex"} alignItems={"center"} justifyContent={"center"}>
        {winner === "Draw" ? (
          <img src={"/bombasticSideEye.gif"} />
        ) : (
          <SpaceBetween size={"s"}>
            <span>
              Congrats Player {winner}: {player}
            </span>
            <img src={"/winner.gif"} />
          </SpaceBetween>
        )}
      </Box>
    </Modal>
  );
};

const PageSubscriptions = ({ onError }) => {
  const client = generateClient();

  useEffect(() => {
    const sendError = client
      .graphql({ query: onSendError, variables: { SessionID } })
      .subscribe({
        next: ({ data }) => onError(data.onSendError),
      });

    return () => {
      sendError.unsubscribe();
    };
  }, []);

  return null;
};
