import { Chess } from "chess.js";
import { Ic } from "isepic-chess";
import { MovesList } from "./MovesList";
import { LinearBar } from "./LinearBar";
import { ChatWindow } from "./ChatWindow";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Environment } from "@react-three/drei";
import { useQuery } from "@tanstack/react-query";
import { Box, Chip, Unstable_Grid2 as Grid } from "@mui/material";
import { useGetLatestMove, useListComments } from "../../api/api";
import { ThreeChessBoard } from "../../components/ThreeChessBoard";
import {
  Button,
  Modal,
  SpaceBetween,
  StatusIndicator,
} from "@cloudscape-design/components";
import {
  ChatContainer,
  ConversationHeader,
  MainContainer,
  MessageList,
} from "@chatscope/chat-ui-kit-react";

import Cookies from "universal-cookie";

const cookies = new Cookies(null, { path: "/" });
const SessionID = cookies.get("ChessReinvent2024SessionID");

export const ThreeDimensional = () => {
  const ref = useRef<HTMLDivElement>(null);
  const comments = useListComments(SessionID);
  const latestMove = useGetLatestMove(SessionID);
  const session = useQuery({ queryKey: ["session", SessionID] }) as any;

  const [mate, setMate] = useState(null);
  const [modal, setModal] = useState(false);
  const [winner, setWinner] = useState(null);
  const [navHeight, setNavHeight] = useState(40);
  const [board, setBoard] = useState(new Chess(latestMove.data.Move));
  const [isepicBoard, setIsepicBoard] = useState(
    Ic.initBoard({ fen: latestMove.data.Move })
  );

  useEffect(() => {
    setNavHeight(ref.current.clientHeight);
  }, [ref.current]);

  // If LatestMove updates
  useEffect(() => {
    const { GameWinner } = latestMove.data;

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

    setBoard(new Chess(latestMove.data.Move));
    setIsepicBoard(Ic.initBoard({ fen: latestMove.data.Move }));
  }, [latestMove.data]);

  useEffect(() => {
    if (winner) {
      setModal(true);
    }
  }, [winner]);

  return (
    <Box
      p={3}
      gap={3}
      height={"100%"}
      display={"flex"}
      bgcolor={"rgb(7, 24, 54)"}
      justifyContent={"space-around"}
    >
      <Box flexGrow={1} minWidth={"20%"} maxWidth={"25%"}>
        <ChatWindow comments={comments} />
      </Box>

      <Box flexGrow={2} display={"flex"} gap={3} flexDirection={"column"}>
        {/* North */}
        <Box
          gap={3}
          display={"flex"}
          height={"calc(50% - 12px)"}
          justifyContent={"space-between"}
        >
          <Box maxWidth={"67%"} flexGrow={2}>
            <Canvas
              shadows
              style={{ borderRadius: "25px" }}
              camera={{ position: [-5, 4, 8], fov: 50 }}
            >
              <Environment preset={"sunset"} background blur={0.67} />
              <ThreeChessBoard autoRotate latestMove={latestMove} />
            </Canvas>
          </Box>

          <Box
            ref={ref}
            flexGrow={1}
            maxWidth={"30%"}
            display={"flex"}
            justifyContent={"center"}
          >
            <div>
              <Chessboard
                boardWidth={navHeight}
                position={latestMove.data.Move}
                customBoardStyle={{
                  borderRadius: "10px",
                }}
                arePiecesDraggable={false}
              />
            </div>
          </Box>
        </Box>

        {/* South */}
        <Box gap={3} height={"calc(50% - 12px)"} display={"flex"}>
          <Box maxWidth={"67%"} flexGrow={2} height={"100%"}>
            <Grid container height={"100%"} spacing={1.5}>
              <Grid xs={6}>
                <MainContainer
                  style={{
                    height: "20dvh",
                    borderRadius: "10px",
                  }}
                >
                  <ChatContainer>
                    <ConversationHeader>
                      <ConversationHeader.Content
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                        userName="Game Status"
                      />
                    </ConversationHeader>

                    <MessageList>
                      <Grid height={"80%"} container>
                        <Grid xs={12} md={6}>
                          <Box
                            pt={1}
                            height={"100%"}
                            display={"flex"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            flexDirection={"column"}
                            pl={4}
                            gap={0.3}
                          >
                            <Box sx={{ color: "rgb(193,193,193)" }}>
                              isCheck
                            </Box>
                            <StatusIndicator
                              type={board.isCheck() ? "success" : "error"}
                            >
                              {board.isCheck() ? "Yes" : "No"}
                            </StatusIndicator>
                          </Box>
                        </Grid>
                        <Grid xs={12} md={6}>
                          <Box
                            pt={1}
                            pr={4}
                            height={"100%"}
                            display={"flex"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            flexDirection={"column"}
                            gap={0.3}
                          >
                            <Box sx={{ color: "rgb(193,193,193)" }}>
                              isCheckmate
                            </Box>
                            <StatusIndicator
                              type={board.isCheckmate() ? "success" : "error"}
                            >
                              {board.isCheckmate() ? "Yes" : "No"}
                            </StatusIndicator>
                          </Box>
                        </Grid>
                        <Grid xs={12} md={6}>
                          <Box
                            pl={4}
                            pb={1}
                            height={"100%"}
                            display={"flex"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            flexDirection={"column"}
                            gap={0.3}
                          >
                            <Box sx={{ color: "rgb(193,193,193)" }}>
                              isStalemate
                            </Box>
                            <StatusIndicator
                              type={board.isStalemate() ? "success" : "error"}
                            >
                              {board.isStalemate() ? "Yes" : "No"}
                            </StatusIndicator>
                          </Box>
                        </Grid>
                        <Grid xs={12} md={6}>
                          <Box
                            pr={4}
                            pb={1}
                            height={"100%"}
                            display={"flex"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            flexDirection={"column"}
                            gap={0.3}
                          >
                            <Box sx={{ color: "rgb(193,193,193)" }}>
                              isGameOver
                            </Box>
                            <StatusIndicator
                              type={board.isGameOver() ? "success" : "error"}
                            >
                              {board.isGameOver() ? "Yes" : "No"}
                            </StatusIndicator>
                          </Box>
                        </Grid>
                      </Grid>
                    </MessageList>
                  </ChatContainer>
                </MainContainer>
              </Grid>

              <Grid xs={6}>
                <MainContainer
                  style={{
                    height: "20dvh",
                    borderRadius: "10px",
                  }}
                >
                  <ChatContainer>
                    <ConversationHeader>
                      <ConversationHeader.Content
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                        userName="StockFish Analytics"
                      />
                    </ConversationHeader>

                    <MessageList>
                      {!winner && (
                        <LinearBar
                          winner={winner}
                          latestMove={latestMove.data}
                          setMate={setMate}
                        />
                      )}
                    </MessageList>
                  </ChatContainer>
                </MainContainer>
              </Grid>

              <Grid xs={6}>
                <MainContainer
                  style={{
                    height: "20dvh",
                    borderRadius: "10px",
                  }}
                >
                  <ChatContainer>
                    <ConversationHeader>
                      <ConversationHeader.Content
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                        userName={`Game ${winner ? "Winner" : "Progress"}`}
                      />
                    </ConversationHeader>

                    <MessageList>
                      {winner ? (
                        <Box
                          height={"80%"}
                          display={"flex"}
                          justifyContent={"center"}
                          alignItems={"center"}
                        >
                          <Box display={"flex"} gap={2}>
                            🎉{" "}
                            <Chip
                              size="medium"
                              label={winner}
                              color="success"
                            />{" "}
                            🎉
                          </Box>
                        </Box>
                      ) : (
                        <Grid height={"80%"} container>
                          <Grid xs={12} md={6}>
                            <Box
                              height={"100%"}
                              display={"flex"}
                              justifyContent={"center"}
                              alignItems={"center"}
                              flexDirection={"column"}
                              pl={4}
                              color={"rgb(145, 145, 145)"}
                              gap={0.3}
                            >
                              <Box sx={{ color: "rgb(193,193,193)" }}>
                                End Game
                              </Box>
                              {mate ? mate : "None Detected"}
                            </Box>
                          </Grid>
                          <Grid xs={12} md={6}>
                            <Box
                              pr={4}
                              height={"100%"}
                              display={"flex"}
                              justifyContent={"center"}
                              alignItems={"center"}
                              flexDirection={"column"}
                              gap={0.3}
                            >
                              <Box sx={{ color: "rgb(193,193,193)" }}>Turn</Box>
                              <Box>
                                <Chip
                                  size="small"
                                  sx={{
                                    bgcolor:
                                      board.turn() === "w"
                                        ? "rgb(180,193,193)"
                                        : "black",
                                    color:
                                      board.turn() === "w" ? "black" : "white",
                                  }}
                                  label={
                                    board.turn() === "w" ? "White" : "Black"
                                  }
                                />
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    </MessageList>
                  </ChatContainer>
                </MainContainer>
              </Grid>

              <Grid xs={6}>
                <MainContainer
                  style={{
                    height: "20dvh",
                    borderRadius: "10px",
                  }}
                >
                  <ChatContainer>
                    <ConversationHeader>
                      <ConversationHeader.Content
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                        userName="Counters"
                      />
                    </ConversationHeader>

                    <MessageList>
                      <Box
                        height={"80%"}
                        display={"flex"}
                        justifyContent={"space-evenly"}
                        alignItems={"center"}
                      >
                        <Box
                          height={"100%"}
                          display={"flex"}
                          justifyContent={"center"}
                          alignItems={"center"}
                          flexDirection={"column"}
                          color="rgb(145,145,145)"
                        >
                          <Box sx={{ color: "rgb(193,193,193)" }}>
                            Move Count
                          </Box>
                          {latestMove.data.MoveCount}
                        </Box>
                        <Box
                          height={"100%"}
                          display={"flex"}
                          justifyContent={"center"}
                          alignItems={"center"}
                          flexDirection={"column"}
                          color="rgb(145,145,145)"
                        >
                          <Box sx={{ color: "rgb(193,193,193)" }}>
                            HalfMoves
                          </Box>
                          {isepicBoard.halfMove}
                        </Box>
                      </Box>
                    </MessageList>
                  </ChatContainer>
                </MainContainer>
              </Grid>
            </Grid>
          </Box>

          <Box width={"30%"} flexGrow={1}>
            <MovesList />
          </Box>
        </Box>
      </Box>

      <WinnerModal
        modal={modal}
        setModal={setModal}
        session={session}
        winner={winner}
      />
    </Box>
  );
};

const WinnerModal = ({ modal, setModal, session, winner }) => {
  const player = session.data[winner ? "WhiteID" : "BlackID"];

  return (
    <Modal
      onDismiss={() => setModal(false)}
      visible={modal}
      footer={
        <Button variant="primary" onClick={() => setModal(false)}>
          {winner === "Draw" ? "Okay..." : "Woohoo!"}
        </Button>
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
