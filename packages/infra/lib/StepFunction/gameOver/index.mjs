import { sendRequest } from "./appsync.mjs";

export const handler = async (event) => {
  console.log(event);
  const { SessionID } = event;

  const reponse = await sendRequest(updateGameStatus(SessionID));

  if (reponse.errors) {
    const { message, locations } = reponse.errors[0];
    throw new Error(message, locations);
  }

  return {
    ...reponse,
    ...event,
  };
};

const updateGameStatus = (SessionID) => {
  return /* GraphQL */ `
  mutation UpdateGameStatus {
    updateGameStatus(input: { SessionID: "${SessionID}", GameStatus: "COMPLETED" }) {
      SessionID 
    }
  }
`;
};
