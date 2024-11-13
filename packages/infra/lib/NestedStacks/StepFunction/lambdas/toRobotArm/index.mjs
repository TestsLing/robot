import {
  IoTDataPlaneClient,
  PublishCommand,
} from "@aws-sdk/client-iot-data-plane";
import { Ic } from "isepic-chess";
import { Chess } from "chess.js";
// import { sendRequest } from "./appsync.mjs";
import crypto from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SignatureV4 } from "@aws-sdk/signature-v4";

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

const { Sha256 } = crypto;
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL;
const endpoint = new URL(GRAPHQL_ENDPOINT);

const signer = new SignatureV4({
  credentials: defaultProvider(),
  region: process.env.AWS_REGION,
  service: "appsync",
  sha256: Sha256,
});

export const sendRequest = async (query) => {
  const requestToBeSigned = new HttpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: endpoint.host,
    },
    hostname: endpoint.host,
    body: JSON.stringify({ query }),
    path: endpoint.pathname,
  });

  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(GRAPHQL_ENDPOINT, signed);

  const response = await fetch(request);
  return await response.json();
};
