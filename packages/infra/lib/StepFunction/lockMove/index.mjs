import { sendRequest } from "./appsync.mjs";

export const handler = async (event) => {
  console.log(event);
  const { executionId } = event;
  const { SessionID } = event.input;

  const response = await sendRequest(updateLatestMove(SessionID, executionId));

  if (response.errors) {
    const { message, locations } = response.errors[0];
    throw new Error(message, locations);
  }

  return event;
};

const updateLatestMove = (SessionID, SfnExecutionId) => {
  return /* GraphQL */ `
  mutation UpdateLatestMove {
    updateLatestMove(input: { SessionID: "${SessionID}", SfnExecutionId: "${SfnExecutionId}" }) {
      SessionID 
      SK 
      Action 
      Move 
      MoveCount
      TimeStamp
      SfnExecutionId
    }
  }
`;
};
