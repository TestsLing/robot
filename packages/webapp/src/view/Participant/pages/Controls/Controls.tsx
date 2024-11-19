import {
  Alert,
  Modal,
  Button,
  SpaceBetween,
  Header,
} from "@cloudscape-design/components";

import {
  onSendError,
  onUpdateLatestMove,
} from "../../../../graphql/subscriptions";

import Board, { BoardProps } from "@cloudscape-design/board-components/board";
import BoardItem from "@cloudscape-design/board-components/board-item";
import { ChessBoardWindow } from "./ChessBoardWindow/ChessBoardWindow";
import { useGetLatestMove, useGetSession } from "../../api/queries";
import { createGlobalStyle } from "styled-components";
import { ChatWindow } from "./ChatWindow/ChatWindow";
import { MoveWindow } from "./MoveWindow/MoveWindow";
import { generateClient } from "aws-amplify/api";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useForm } from "react-hook-form";
import { Box } from "@mui/material";
import { Ic } from "isepic-chess";

import "./Control.css";

const GlobalStyle = createGlobalStyle`
  div[class*='awsui_content-wrapper'] > [class*='awsui_header_'] {
    background-color: #040724 !important;
  }

  div[class*='awsui_title_'] {
    color: white !important;
  }

  div[class*='awsui_grid_'] {
    gap: 15px !important;
  }
`;

const createAnnouncement = (operationAnnouncement, conflicts, disturbed) => {
  const conflictsAnnouncement =
    conflicts.length > 0
      ? `Conflicts with ${conflicts.map((c) => c.data.title).join(", ")}.`
      : "";
  const disturbedAnnouncement =
    disturbed.length > 0 ? `Disturbed ${disturbed.length} items.` : "";
  return [operationAnnouncement, conflictsAnnouncement, disturbedAnnouncement]
    .filter(Boolean)
    .join(" ");
};

export const Controls = () => {
  const { setValue } = useForm();

  const [board] = useState(Ic.initBoard());
  const [modal, setModal] = useState(false);
  const [winner, setWinner] = useState(null);
  const [cookies] = useCookies(["GenAIChessDemoSessionID"]);

  // Control Queries
  const session = useGetSession(cookies.GenAIChessDemoSessionID);
  const latestMove = useGetLatestMove(cookies.GenAIChessDemoSessionID);

  useEffect(() => {
    if (latestMove.data.Move) {
      board.loadFen(latestMove.data.Move);
    }
  }, [latestMove.data.Move]);

  useEffect(() => {
    if (winner) {
      setModal(true);
    }
  }, [winner]);

  const [items, setItems] = useState<BoardProps.Item[]>([
    {
      id: "Chat",
      rowSpan: Math.floor(window.innerHeight / 120),
      columnSpan: 1,
      data: null,
    },
    {
      id: "Board",
      rowSpan: Math.floor(window.innerHeight / 120),
      columnSpan: 2,
      data: null,
    },
    {
      id: "Moves",
      rowSpan: Math.floor(window.innerHeight / 120),
      columnSpan: 1,
      data: null,
    },
  ]);

  return (
    <div
      style={{
        height: "100vh",
        overflow: "clip",
        position: "relative",
      }}
    >
      <video
        src={"/reinvent-bg.mp4"}
        style={{
          zIndex: -1,
          position: "absolute",
          minWidth: "100%",
          minHeight: "100%",
        }}
        autoPlay
        muted
        loop
      />
      <GlobalStyle />
      <div style={{ padding: 15 }}>
        <Board
          items={items}
          onItemsChange={(event) => setItems(event.detail.items as any)}
          renderItem={({ id }) => {
            switch (id) {
              case "Chat":
                return <ChatWindow board={board} session={session} />;
              case "Board":
                return (
                  <ChessBoardWindow
                    board={board}
                    winner={winner}
                    session={session}
                    setWinner={setWinner}
                    latestMove={latestMove}
                  />
                );
              case "Moves":
                return <MoveWindow latestMove={latestMove.data} />;
              default:
                return (
                  <BoardItem
                    header={<Header>{id}</Header>}
                    i18nStrings={{
                      dragHandleAriaLabel: "Drag handle",
                      resizeHandleAriaLabel: "Resize handle",
                    }}
                  >
                    <Alert type="error">
                      Board item title ID not recognised
                    </Alert>
                  </BoardItem>
                );
            }
          }}
          i18nStrings={(() => {
            return {
              liveAnnouncementDndStarted: (operationType) =>
                operationType === "resize" ? "Resizing" : "Dragging",
              liveAnnouncementDndItemReordered: (operation) => {
                const columns = `column ${operation.placement.x + 1}`;
                const rows = `row ${operation.placement.y + 1}`;
                return createAnnouncement(
                  `Item moved to ${
                    operation.direction === "horizontal" ? columns : rows
                  }.`,
                  operation.conflicts,
                  operation.disturbed
                );
              },
              liveAnnouncementDndItemResized: (operation) => {
                const columnsConstraint = operation.isMinimalColumnsReached
                  ? " (minimal)"
                  : "";
                const rowsConstraint = operation.isMinimalRowsReached
                  ? " (minimal)"
                  : "";
                const sizeAnnouncement =
                  operation.direction === "horizontal"
                    ? `columns ${operation.placement.width}${columnsConstraint}`
                    : `rows ${operation.placement.height}${rowsConstraint}`;
                return createAnnouncement(
                  `Item resized to ${sizeAnnouncement}.`,
                  operation.conflicts,
                  operation.disturbed
                );
              },
              liveAnnouncementDndItemInserted: (operation) => {
                const columns = `column ${operation.placement.x + 1}`;
                const rows = `row ${operation.placement.y + 1}`;
                return createAnnouncement(
                  `Item inserted to ${columns}, ${rows}.`,
                  operation.conflicts,
                  operation.disturbed
                );
              },
              liveAnnouncementDndCommitted: (operationType) =>
                `${operationType} committed`,
              liveAnnouncementDndDiscarded: (operationType) =>
                `${operationType} discarded`,
              liveAnnouncementItemRemoved: (op: any) =>
                createAnnouncement(
                  `Removed item ${op.item.data.title}.`,
                  [],
                  op.disturbed
                ),
              navigationAriaLabel: "Board navigation",
              navigationAriaDescription:
                "Click on non-empty item to move focus over",
              navigationItemAriaLabel: (item: any) =>
                item ? item.data.title : "Empty",
            };
          })()}
          empty={
            <Alert type="error">There was an error rendering this page</Alert>
          }
        />
      </div>

      <WinnerModal
        modal={modal}
        setModal={setModal}
        session={session}
        winner={winner}
      />

      <PageSubscriptions
        SessionID={cookies.GenAIChessDemoSessionID}
        onError={({ Error, Cause }) => {
          setValue("chessboard.to", null);
          setValue("chessboard.from", null);
          throw new Error(JSON.stringify({ Error, Cause }));
        }}
        latestMoveRefetch={latestMove.refetch}
      />
    </div>
  );
};

const WinnerModal = ({ modal, setModal, session, winner }) => {
  const player = session.data[winner === "w" ? "WhiteID" : "BlackID"];

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
        <span style={{ color: "black" }}>
          {winner === "Draw"
            ? "😐 The Game has Ended in a Draw 🤨"
            : "🎉 Winner Winner, Chicken Dinner 🎉"}
        </span>
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

const PageSubscriptions = ({ onError, SessionID, latestMoveRefetch }) => {
  const client = generateClient();

  useEffect(() => {
    const sendError = client
      .graphql({ query: onSendError, variables: { SessionID } })
      .subscribe({
        next: ({ data }) => onError(data.onSendError),
      });

    const updateLatestMove = client
      .graphql({ query: onUpdateLatestMove, variables: { SessionID } })
      .subscribe({ next: () => latestMoveRefetch() });

    return () => {
      sendError.unsubscribe();
      updateLatestMove.unsubscribe();
    };
  }, []);

  return null;
};
