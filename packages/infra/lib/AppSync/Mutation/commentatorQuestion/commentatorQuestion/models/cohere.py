import os
from langchain.chains import ConversationChain
from langchain_community.llms import Bedrock
from langchain.memory import ConversationBufferMemory


def callCommand(board, model_id, comment):
    llm = Bedrock(model_id=model_id, region_name=os.environ["BedrockRegion"])

    conversation = ConversationChain(
        llm=llm, verbose=True, memory=ConversationBufferMemory()
    )

    return conversation.predict(input=comment)
