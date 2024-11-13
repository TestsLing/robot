import os
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.chat_models import BedrockChat


def callClaude(board, model_id, comment, history):
    chat = BedrockChat(model_id=model_id, region_name=os.environ["BedrockRegion"])

    prompt = """I'm going to give you a Forsyth-Edwards Notation (FEN) of a chess game contained in <fen></fen> XML tags. Then I'm going to ask you a question about the chess game. I'd like you to answer the question. Here is the Forsyth-Edwards Notation (FEN):
        <fen>{board}</fen>

        Here is the question: {comment}

        Answer the question immediately without preamble."""

    template = PromptTemplate.from_template(
        prompt,
        partial_variables={"board": board},
    )

    messages = []
    print(history)
    for segment in range(len(history)):
        print(messages)
        if segment % 2 == 0:
            messages.append(HumanMessage(content=history[segment]["Comment"]))
        else:
            messages.append(AIMessage(content=history[segment]["Comment"]))

    if len(messages) > 0 and type(messages[-1]) == HumanMessage:
        messages.append(AIMessage(content=""))

    messages.append(HumanMessage(content=template.format(comment=comment)))

    print(messages)

    return chat(messages).content
