import { useState } from "react";
import { usePostQuestion } from "../../api/api";
import Cookies from "universal-cookie";
import { fetchUserAttributes } from "aws-amplify/auth";
import {
  Avatar,
  Message,
  MessageList,
  MessageInput,
  MainContainer,
  ChatContainer,
  TypingIndicator,
  ConversationHeader,
  SendButton,
  Sidebar,
  ConversationList,
  Conversation,
  EllipsisButton,
} from "@chatscope/chat-ui-kit-react";
import { UseQueryResult } from "@tanstack/react-query";

import logo from "./character.jpg";
import { modelOptions } from "../../../Admin/pages/Sessions/modelOptions";

const cookies = new Cookies(null, { path: "/" });
const SessionID = cookies.get("ChessReinvent2024SessionID");

interface IChatWindow {
  comments: UseQueryResult;
  activeColor: string;
  board: string;
}

export const ChatWindow = ({ comments, activeColor, board }: IChatWindow) => {
  const [input, setInput] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const [provider, setProvider] = useState({
    label: "Claude 3 Haiku",
    value: "anthropic.claude-3-haiku-20240307-v1:0",
  });

  const { mutateAsync, isPending } = usePostQuestion(SessionID);

  const postQuestion = async () => {
    if (input) {
      const user = await fetchUserAttributes();

      await mutateAsync({
        Comment: input,
        Author: `${user.email}#${activeColor}`,
        Board: board,
        Model: provider.value,
      });

      setInput("");
    }
  };

  return (
    <MainContainer
      style={{
        height: "88dvh",
        borderRadius: "10px",
      }}
    >
      <Sidebar position="left" hidden={sidebar}>
        <ConversationList>
          {modelOptions.map((providers) => {
            return providers.options.map((model) => {
              return (
                <Conversation
                  name={model.label}
                  onClick={() => {
                    setProvider(model);
                  }}
                  style={{
                    fontSize: ".75em",
                    fontWeight: 600,
                  }}
                />
              );
            });
          })}
        </ConversationList>
      </Sidebar>

      <ChatContainer>
        <ConversationHeader>
          <ConversationHeader.Actions>
            <EllipsisButton
              orientation="vertical"
              onClick={() => setSidebar(!sidebar)}
            />
          </ConversationHeader.Actions>

          <Avatar src={logo} name="Chat" />
          <ConversationHeader.Content userName={provider.label} info="Active" />
        </ConversationHeader>

        <MessageList
          typingIndicator={
            isPending && <TypingIndicator content="GenAI is thinking" />
          }
        >
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
                >
                  <Avatar src={logo} />
                </Message>
              );
            }
          )}
        </MessageList>
        <SendButton />
        <MessageInput
          value={input}
          disabled={isPending}
          attachButton={false}
          onSend={() => postQuestion()}
          placeholder="Type message here"
          onChange={(value) => setInput(value)}
        />
      </ChatContainer>
    </MainContainer>
  );
};
