import {
  Button,
  ContentLayout,
  Header,
  SpaceBetween,
  Table,
} from "@cloudscape-design/components";

import { useGamesByMoveCount } from "../../api/queries";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";

export const Leaderboard = () => {
  const { data } = useGamesByMoveCount();
  const navigate = useNavigate();

  return (
    <ContentLayout
      header={
        <Box pl={5} pb={2} pt={3}>
          <Header
            variant="h1"
            description="These are all games current and past ranked by move count"
          >
            Leaderboard
          </Header>
        </Box>
      }
    >
      <Box px={5}>
        <SpaceBetween size="m">
          <Table
            loadingText="Retrieving Sessions"
            selectionType="single"
            header={
              <Button onClick={() => navigate("/admin")}>Admin Console</Button>
            }
            columnDefinitions={[
              {
                header: "Session ID",
                cell: (item) => item.SessionID,
              },
              {
                header: "Number Of Moves",
                cell: (item) => item.MoveCount,
              },
              {
                header: "Game Winner",
                cell: (item) => {
                  switch (item.GameWinner) {
                    case "w":
                      return "White";
                    case "b":
                      return "Black";
                    default:
                      return item.GameWinner ? item.GameWinner : "Pending";
                  }
                },
              },
            ]}
            empty={
              <Box
                margin={{ vertical: "xs" }}
                textAlign="center"
                color="inherit"
              >
                <b>No game recorded</b>
              </Box>
            }
            items={data ?? []}
          />
        </SpaceBetween>
      </Box>
    </ContentLayout>
  );
};
