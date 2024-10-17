import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { sendRequest } from "./appsync.mjs";
import { Chess } from "chess.js";

const client = new DynamoDBClient({});

const TableName = process.env.TableName;

export const handler = async (event) => {
  console.log(event);
  const { SessionID, PlayerOutput, LatestMove, Session } = event.input;
  const { Move, SanList } = PlayerOutput;
  const { Item } = LatestMove;
  const chess = new Chess(Move);

  const checkGameOver = () => {
    if (chess.isGameOver()) {
      const lastMove = new Chess(Item.Move.S);

      return chess.isCheckmate() ? lastMove.turn() : "Draw";
    }
    return null;
  };

  const reponse = await sendRequest(
    updateLatestMove(
      SessionID,
      Move,
      parseInt(Item.MoveCount.N) + 1,
      checkGameOver(),
      SanList
    )
  );

  if (reponse.errors) {
    const { message, locations } = reponse.errors[0];
    throw new Error(message, locations);
  }

  await client.send(
    new PutItemCommand({
      TableName,
      Item: {
        ...Item,
        SK: {
          S: `MOVE#${new Date().toISOString()}`,
        },
        SfnExecutionId: {
          S: event.executionId,
        },
      },
    })
  );

  // Trigger the next to move by returning below
  const { Item: Record } = Session;
  return {
    ...event.input,
    TurnActor: chess.turn() ? Record.White.S : Record.Black.S,
    IsGameOver: chess.isGameOver(),
  };
};

const updateLatestMove = (SessionID, Move, MoveCount, GameWinner, SanList) => {
  return /* GraphQL */ `
  mutation UpdateLatestMove {
    updateLatestMove(input: { 
      SessionID: "${SessionID}", 
      Action: "MOVE",
      Move: "${Move}", 
      SfnExecutionId: "",
      SuggestedMove: "",
      TaskToken: "",
      SanList: "${SanList}"
      MoveCount: ${MoveCount}
      ${GameWinner ? `, GameWinner: "${GameWinner}"` : ""} 
    }) {
      SessionID 
    }
  }
`;
};
