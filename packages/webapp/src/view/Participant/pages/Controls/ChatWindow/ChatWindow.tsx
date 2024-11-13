import {
  Avatar,
  Message,
  MessageList,
  MessageInput,
  ChatContainer,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";

import {
  onCreateComment,
  onPostQuestion,
} from "../../../../../graphql/subscriptions";

import { Avatar as AwsAvatar } from "@cloudscape-design/chat-components";
import { useListFoundationModels } from "../../../../Admin/api/queries";
import { ButtonDropdown, Header } from "@cloudscape-design/components";
import { BoardItem } from "@cloudscape-design/board-components";
import { usePostQuestion } from "../../../api/mutations";
import { useListComments } from "../../../api/queries";
import { fetchUserAttributes } from "aws-amplify/auth";
import { Controller, useForm } from "react-hook-form";
import { generateClient } from "aws-amplify/api";
import { useCookies } from "react-cookie";
import { useEffect } from "react";

interface IChatWindow {
  board: any;
}

export const ChatWindow = ({ board }: IChatWindow) => {
  const [cookies] = useCookies(["GenAIChessDemoSessionID"]);

  const foundationModels = useListFoundationModels();
  const comments = useListComments(cookies.GenAIChessDemoSessionID);

  const { mutateAsync, isPending } = usePostQuestion(
    cookies.GenAIChessDemoSessionID
  );
  const { control, resetField, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    const { chatInput, chatModel } = data;
    const user = await fetchUserAttributes();

    await mutateAsync({
      Comment: chatInput,
      Author: `${user.email}#${board.activeColor}`,
      Board: board.fen,
      ModelID: chatModel.modelId,
    });

    resetField("chatInput");
  };

  return (
    <form style={{ display: "contents" }} onSubmit={handleSubmit(onSubmit)}>
      <BoardItem
        disableContentPaddings
        header={
          <Header
            actions={
              foundationModels.data && (
                <Controller
                  name="chatModel"
                  control={control}
                  defaultValue={foundationModels.data[0]}
                  render={({ field: { onChange, value } }) => (
                    <ButtonDropdown
                      variant="primary"
                      loading={foundationModels.isLoading}
                      items={
                        foundationModels.data?.map((x) => {
                          return {
                            id: x.modelId,
                            text: x.modelName,
                          };
                        }) ?? []
                      }
                      onItemClick={({ detail }) => {
                        const modelRecord = foundationModels.data.find(
                          ({ modelId }) => modelId === detail.id
                        );
                        onChange(modelRecord);
                      }}
                    >
                      {value.modelName}
                    </ButtonDropdown>
                  )}
                />
              )
            }
          >
            Chat
          </Header>
        }
        i18nStrings={{
          dragHandleAriaLabel: "Drag handle",
          resizeHandleAriaLabel: "Resize handle",
        }}
      >
        <Controller
          name="chatInput"
          control={control}
          defaultValue={null}
          render={({ field }) => (
            <ChatContainer>
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
                        <Avatar size="md">
                          <div
                            style={{
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {!msg.Author.includes("@") ? (
                              <AwsAvatar
                                ariaLabel="Avatar of generative AI assistant"
                                tooltipText="Generative AI assistant"
                                iconName="gen-ai"
                                color="gen-ai"
                              />
                            ) : (
                              <AwsAvatar
                                ariaLabel="Avatar of human"
                                tooltipText="Human"
                              />
                            )}
                          </div>
                        </Avatar>
                      </Message>
                    );
                  }
                )}
              </MessageList>
              <MessageInput
                {...field}
                sendButton={false}
                attachButton={false}
                disabled={isPending}
                onSend={() => handleSubmit(onSubmit)()}
                placeholder="Type message here"
              />
            </ChatContainer>
          )}
        />
      </BoardItem>

      <PageSubscriptions
        comments={comments}
        SessionID={cookies.GenAIChessDemoSessionID}
      />
    </form>
  );
};

const PageSubscriptions = ({ comments, SessionID }) => {
  const client = generateClient();

  useEffect(() => {
    const postQuestion = client
      .graphql({ query: onPostQuestion, variables: { SessionID } })
      .subscribe({ next: () => comments.refetch() });

    const createComment = client
      .graphql({ query: onCreateComment, variables: { SessionID } })
      .subscribe({ next: () => comments.refetch() });

    return () => {
      postQuestion.unsubscribe();
      createComment.unsubscribe();
    };
  }, []);

  return null;
};
