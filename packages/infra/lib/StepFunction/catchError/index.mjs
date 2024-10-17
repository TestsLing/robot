import { sendRequest } from "./appsync.mjs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbClient = DynamoDBDocumentClient.from(client);

const TableName = process.env.TableName;

export const handler = async (event) => {
  console.log(event);
  const { SessionID, ErrorInfo } = event;

  const response = await sendRequest(sendError(SessionID, ErrorInfo));

  if (response.errors) {
    const { message, locations } = response.errors[0];
    throw new Error(message, locations);
  }

  await ddbClient.send(
    new UpdateCommand({
      TableName,
      Key: { SessionID, SK: "MOVE#LATEST" },
      UpdateExpression: "REMOVE SfnExecutionId, TaskToken",
    })
  );

  const seshError = await sendRequest(
    updateSessionWithError(SessionID, ErrorInfo)
  );

  if (seshError.errors) {
    const { message, locations } = seshError.errors[0];
    throw new Error(message, locations);
  }

  throw new Error("Caught Error");
};

const sendError = (SessionID, { Error, Cause }) => {
  return /* GraphQL */ `
  mutation SendError {
    sendError(input: { SessionID: "${SessionID}", Error: "${Error}", Cause: ${JSON.stringify(
    Cause
  )} }) {
      SessionID
      Error
      Cause
    }
  }
`;
};

const updateSessionWithError = (SessionID, { Error, Cause }) => {
  return /* GraphQL */ `
  mutation UpdateSession {
    updateSession(input: { SessionID: "${SessionID}", GameStatus: "ERROR", Error: "${Error}", Cause: ${JSON.stringify(
    Cause
  )} 
    }) {
      SessionID
      SK
    }
  }
`;
};
