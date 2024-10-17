import { useState } from "react";
import { Box } from "@mui/material";
import { PlayerOutlet } from "./PlayerOutlet";
import { HeaderNavigation } from "./navigation/HeaderNavigation";
import { SearchSessionID } from "./components/SearchSessionID";

export const Participant = () => {
  const [navHeight, setNavHeight] = useState(40);

  return (
    <SearchSessionID>
      {() => (
        <>
          <HeaderNavigation setNavHeight={setNavHeight} />
          <Box height={`calc(100vh - ${navHeight}px)`}>
            <PlayerOutlet />
          </Box>
        </>
      )}
    </SearchSessionID>
  );
};
