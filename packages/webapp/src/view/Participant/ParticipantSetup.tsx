import { useAtom } from "jotai";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useCookies } from "react-cookie";
import { navHeightPxAtom, toastAtom } from "../../common/atom";
import { Navigation } from "./navigation/Navigation";
import { SearchSessionID } from "./components/SearchSessionID";
import { Alert, Spinner } from "@cloudscape-design/components";
import { useGetLatestMove, useGetMoves, useGetSession } from "./api/queries";

export const ParticipantSetup = () => {
  const [navHeight] = useAtom(navHeightPxAtom);

  return (
    <SearchSessionID>
      {() => (
        <>
          <Navigation />
          <div style={{ height: `calc(100vh - ${navHeight}px)` }}>
            <PlayerOutlet />
          </div>
        </>
      )}
    </SearchSessionID>
  );
};

export const PlayerOutlet = () => {
  const [cookies] = useCookies(["GenAIChessDemoSessionID"]);
  const [, setToast] = useAtom(toastAtom);

  const latestMove = useGetLatestMove(cookies.GenAIChessDemoSessionID);
  const session = useGetSession(cookies.GenAIChessDemoSessionID);
  const moves = useGetMoves(cookies.GenAIChessDemoSessionID);

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

  return latestMove.isLoading || moves.isLoading ? (
    <div
      style={{
        transform: "translate(-50%, -50%)",
        position: "absolute",
        left: "50%",
        top: "50%",
      }}
    >
      <Spinner size="large" />
    </div>
  ) : latestMove.data && moves.data ? (
    <Outlet />
  ) : (
    <div style={{ margin: 15 }}>
      <Alert type="error">
        <pre>latestMove: {JSON.stringify(latestMove.data, null, 2)}</pre>
        <pre>moves: {JSON.stringify(moves.data, null, 2)}</pre>
        <b>Error: latestMove or moves should not be null</b>
      </Alert>
    </div>
  );
};
