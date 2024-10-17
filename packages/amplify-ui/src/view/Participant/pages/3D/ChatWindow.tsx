import { UseQueryResult } from "@tanstack/react-query";
import {
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageList,
} from "@chatscope/chat-ui-kit-react";

interface IChatWindow {
  comments: UseQueryResult;
}

export const ChatWindow = ({ comments }: IChatWindow) => {
  return (
    <MainContainer
      style={{
        borderRadius: "10px",
      }}
    >
      <ChatContainer>
        <ConversationHeader>
          <ConversationHeader.Content userName="Chat" />
        </ConversationHeader>

        <MessageList>
          {(comments.data as any)?.map(
            (msg: { SK: string; Author: string; Comment: string }) => {
              return (
                <Message
                  key={msg.SK}
                  model={{
                    position: "single",
                    sentTime: msg.SK,
                    sender: msg.Author,
                    message: msg.Comment,
                    direction: msg.Author.includes("@")
                      ? "outgoing"
                      : "incoming",
                  }}
                />
              );
            }
          )}
        </MessageList>
      </ChatContainer>
    </MainContainer>
  );
};
