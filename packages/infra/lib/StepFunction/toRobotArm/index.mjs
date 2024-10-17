import {
  IoTDataPlaneClient,
  PublishCommand,
} from "@aws-sdk/client-iot-data-plane";
import { Ic } from "isepic-chess";
import { Chess } from "chess.js";
import { sendRequest } from "./appsync.mjs";

const client = new IoTDataPlaneClient({});

export const handler = async (event, context) => {
  const { SessionID, LatestMove, PlayerOutput } = event.input;
  const { taskToken } = event;

  const isepic = Ic.initBoard({ fen: LatestMove.Item.Move.S });
  const isepicMove = isepic.playMove(PlayerOutput.Move);

  const chessjs = new Chess(LatestMove.Item.Move.S);
  const chessjsMove = chessjs.move(isepicMove.san);

  const request = {
    ...chessjsMove,
    action: "move",
    sessionId: SessionID,
    taskToken,
  };

  await client.send(
    new PublishCommand({
      topic: process.env.topicRule,
      contentType: "application/json",
      payload: JSON.stringify(request),
      qos: 1,
    })
  );

  const response = await sendRequest(
    updateLatestMove(SessionID, taskToken, PlayerOutput.Move)
  );

  if (response.errors) {
    const { message, locations } = response.errors[0];
    throw new Error(message, locations);
  }

  return request;
};

const updateLatestMove = (SessionID, taskToken, SuggestedMove) => {
  return /* GraphQL */ `
  mutation UpdateLatestMove {
    updateLatestMove(input: { SessionID: "${SessionID}", TaskToken: "${taskToken}", SuggestedMove: "${SuggestedMove}" }) {
      SessionID 
      SK 
      Action 
      Move 
      MoveCount
      TimeStamp
      SfnExecutionId
      TaskToken
      SuggestedMove
    }
  }
`;
};
