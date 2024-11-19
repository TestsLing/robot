import {
  ChatContainer,
  MessageList,
  Message,
} from "@chatscope/chat-ui-kit-react";

import { Badge, Header, SpaceBetween } from "@cloudscape-design/components";
import { BoardItem } from "@cloudscape-design/board-components";
import { useFieldArray, useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { useGetMoves } from "../../../api/queries";
import { Chessboard } from "react-chessboard";
import { useCookies } from "react-cookie";
import { Leva, useControls } from "leva";
import { Ic } from "isepic-chess";

export const MoveWindow = ({ latestMove }) => {
  const [cookies] = useCookies(["GenAIChessDemoSessionID"]);

  const moves = useGetMoves(cookies.GenAIChessDemoSessionID);

  const scrollChatRef = useRef(null);
  const msgWindowRef = useRef(null);

  const moveWindowConfig = useControls({
    autoScroll: true,
  });

  const { control } = useForm();
  const { fields, replace, append } = useFieldArray({
    control,
    name: "moves",
  });

  useEffect(() => {
    replace(moves.data);
  }, []);

  useEffect(() => {
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (moveWindowConfig.autoScroll) scrollChatRef.current?.scrollToBottom();
    })();
  }, [msgWindowRef.current?.clientHeight]);

  useEffect(() => {
    if (fields.length && latestMove.Move !== fields[fields.length - 1]?.Move) {
      append(latestMove);
    }
  }, [latestMove]);

  //  Chessboard
  const msgDivRef = useRef(null);
  const [boardDiv, setBoardDiv] = useState(350);
  useEffect(() => {
    const { current } = msgDivRef;

    if (current?.offsetWidth) setBoardDiv(current?.offsetWidth);
  }, [msgDivRef.current, msgDivRef.current?.offsetWidth]);

  return (
    <BoardItem
      header={
        <Header
          actions={
            <Leva
              fill
              hideCopyButton
              titleBar={false}
              theme={{
                sizes: {
                  controlWidth: "20px",
                },
              }}
            />
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
        <MessageList ref={scrollChatRef}>
          <div
            ref={msgDivRef}
            style={{
              padding: 15,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <SpaceBetween size="xs" alignItems="center">
              <Chessboard
                customDarkSquareStyle={{
                  backgroundColor: "#7D945D",
                }}
                customLightSquareStyle={{
                  backgroundColor: "#EBECD3",
                }}
                boardWidth={boardDiv - 150}
                arePiecesDraggable={false}
                customBoardStyle={{
                  borderRadius: "5px",
                }}
              />
              <Badge color="green">Start State</Badge>
            </SpaceBetween>
          </div>
          <div ref={msgWindowRef} style={{ paddingBottom: 50 }}>
            {fields
              .filter(({ Action }) => Action !== "INITIALISE_BOARD")
              .map(({ Move }, i, arr) => {
                const colour = Move.split(" ")[1];

                const chess = Ic.initBoard({ fen: fields[i]?.Move });
                const playMove = chess.playMove(Move);

                return (
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
                        customArrows={[
                          [playMove?.fromBos, playMove?.toBos, "red"],
                        ]}
                        customDarkSquareStyle={{
                          backgroundColor: "#7D945D",
                        }}
                        customLightSquareStyle={{
                          backgroundColor: "#EBECD3",
                        }}
                        key={Move}
                        position={Move}
                        boardWidth={boardDiv - 150}
                        arePiecesDraggable={false}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {colour === "b" ? "White" : "Black"}
                        {i === arr.length - 1 && (
                          <div style={{ marginTop: 8 }}>
                            <Badge color="blue">Latest Move</Badge>
                          </div>
                        )}
                      </div>
                    </Message.CustomContent>
                  </Message>
                );
              })}
          </div>
        </MessageList>
      </ChatContainer>
    </BoardItem>
  );
};
