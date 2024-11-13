import {
  Box,
  Chip,
  Grid,
  LinearProgress,
  linearProgressClasses,
  styled,
} from "@mui/material";
import { Chess } from "chess.js";
import { useEffect, useState } from "react";

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: "#000",
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: theme.palette.mode === "light" ? "#fff" : "#000",
  },
}));

export const LinearBar = ({ winner, latestMove, setMate }) => {
  const [cpScore, setCpScore] = useState("");
  const [evaluation, setEvaluation] = useState(50);

  const convertEvaluation = (ev) => {
    const chess = new Chess(latestMove.Move);
    const turn = chess.turn();
    if (turn === "b") {
      if (ev.startsWith("M-")) {
        setMate(`White in ${ev.split("-")[1]}`);
        setEvaluation(100);
      } else if (ev.startsWith("M")) {
        setMate(`Black in ${ev.slice(1)}`);
        setEvaluation(0);
      } else {
        setMate(null);
        setEvaluation(normalise(parseInt(ev), -7000, 7000) * 100);
      }
    } else if (turn === "w") {
      if (ev.startsWith("M-")) {
        setMate(`Black in ${ev.split("-")[1]}`);
        setEvaluation(0);
      } else if (ev.startsWith("M")) {
        setMate(`White in ${ev.slice(1)}`);
        setEvaluation(100);
      } else {
        setMate(null);
        setEvaluation(100 - normalise(parseInt(ev), -7000, 7000) * 100);
      }
    }

    return ev;
  };

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
            setCpScore(evalutaion);
            convertEvaluation(evalutaion);
          } else if (message[i] === "score" && index === 0) {
            evalutaion = "M" + message[i + 2];
            setCpScore(evalutaion);
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
    };
  }, [latestMove.Move]);

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      justifyContent={"center"}
      alignContent={"center"}
      sx={{ color: "rgb(145,145,145)" }}
      height={"70%"}
      p={3}
    >
      <Grid my={1.5} mt={2} container columnSpacing={3}>
        <Grid item xs={4}>
          <Box
            height={"100%"}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            flexDirection={"column"}
          >
            <Box sx={{ color: "rgb(193,193,193)" }}>
              {winner ? "Winner" : "Winning"}
            </Box>
            <Box>
              {winningSide(evaluation) === "Draw" ? (
                <Chip size="small" label={"Draw"} color="info" />
              ) : (
                <Chip
                  size="small"
                  sx={{
                    bgcolor:
                      winningSide(evaluation) === "White" ? "white" : "black",
                    color:
                      winningSide(evaluation) === "White" ? "black" : "white",
                  }}
                  label={winningSide(evaluation)}
                />
              )}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box
            height={"100%"}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            flexDirection={"column"}
          >
            <Box sx={{ color: "rgb(193,193,193)" }}>Centipawn</Box>
            <Box>{cpScore}</Box>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box
            height={"100%"}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            flexDirection={"column"}
          >
            <Box sx={{ color: "rgb(193,193,193)" }}>% Score</Box>
            <Box>{evaluation.toFixed(2)}</Box>
          </Box>
        </Grid>
      </Grid>

      <Box pt={2}>
        <BorderLinearProgress variant="determinate" value={evaluation} />
      </Box>
    </Box>
  );
};

const winningSide = (score: number) => {
  if (score === 50) {
    return "Draw";
  } else if (score > 50) {
    return "White";
  } else if (score < 50) {
    return "Black";
  }
};

const normalise = (val, max, min) => (val - min) / (max - min);
