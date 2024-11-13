import os
import requests
from datetime import datetime

from models.meta import callLlama
from models.amazon import callTitan
from models.ai21 import callJurrasic
from models.cohere import callCommand
from models.anthropic import callClaude
from models.mistral_ai import callMistral


def handler(event, context):
    print(event)
    session_id = event["SessionID"]
    history = event["History"]
    comment = event["Comment"]
    board = event["Board"]
    model_id = event["Model"]

    if model_id.startswith("amazon"):
        answer = callTitan(board, model_id, comment, history)

    elif model_id.startswith("anthropic"):
        answer = callClaude(board, model_id, comment, history)

    elif model_id.startswith("ai21"):
        answer = callJurrasic(board, model_id, comment)

    elif model_id.startswith("cohere"):
        answer = callCommand(board, model_id, comment)

    elif model_id.startswith("meta"):
        answer = callLlama(board, model_id, comment, history)

    elif model_id.startswith("mistral"):
        answer = callMistral(board, model_id, comment, history)

    else:
        raise Exception(f"model_id not supported {model_id}")

    answer_obj = {
        "SessionID": session_id,
        "SK": f"COMMENT#{datetime.now().isoformat()}",
        "Comment": answer,
        "Author": model_id,
    }

    return answer_obj
