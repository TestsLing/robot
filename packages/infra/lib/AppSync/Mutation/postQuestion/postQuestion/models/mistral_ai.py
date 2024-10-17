import os
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
from langchain_community.chat_models import BedrockChat


def callMistral(board, model_id, comment):
    chat = BedrockChat(model_id=model_id, region_name=os.environ["BedrockRegion"])

    prompt = """I'm going to give you a Forsyth-Edwards Notation (FEN) of a chess game contained in <fen></fen> XML tags. Then I'm going to ask you a question about the chess game. I'd like you to answer the question. Here is the Forsyth-Edwards Notation (FEN):
        <fen>{board}</fen>

        Here is the question: {comment}

        Answer the question immediately without preamble."""

    template = PromptTemplate.from_template(
        prompt,
        partial_variables={
            "board": board,
        },
    )

    messages = [HumanMessage(content=template.format(comment=comment))]

    return chat(messages).content
