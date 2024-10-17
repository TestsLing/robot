import os
import boto3
import requests
from datetime import datetime
from boto3.dynamodb.types import TypeSerializer

from models.meta import callLlama
from models.amazon import callTitan
from models.ai21 import callJurrasic
from models.cohere import callCommand
from models.anthropic import callClaude
from models.mistral_ai import callMistral

serializer = TypeSerializer()
dynamodb_client = boto3.client("dynamodb")


def handler(event, context):
    print(event)
    session_id = event["SessionID"]
    comment = event["Comment"]
    author = event["Author"]
    board = event["Board"]
    model_id = event["Model"]

    if model_id.startswith("amazon"):
        answer = callTitan(board, model_id, comment)

    elif model_id.startswith("anthropic"):
        answer = callClaude(board, model_id, comment)

    elif model_id.startswith("ai21"):
        answer = callJurrasic(board, model_id, comment)

    elif model_id.startswith("cohere"):
        answer = callCommand(board, model_id, comment)

    elif model_id.startswith("meta"):
        answer = callLlama(board, model_id, comment)

    elif model_id.startswith("mistral"):
        answer = callMistral(board, model_id, comment)

    else:
        raise Exception(f"model_id not supported {model_id}")

    question_obj = {
        "SessionID": session_id,
        "SK": f"COMMENT#{datetime.now().isoformat()}",
        "Comment": comment,
        "Author": author,
    }
    dynamodb_client.put_item(
        TableName=os.environ["TableName"],
        Item={k: serializer.serialize(v) for k, v in question_obj.items()},
    )

    answer_obj = {
        "SessionID": session_id,
        "SK": f"COMMENT#{datetime.now().isoformat()}",
        "Comment": answer,
        "Author": model_id,
    }
    dynamodb_client.put_item(
        TableName=os.environ["TableName"],
        Item={k: serializer.serialize(v) for k, v in answer_obj.items()},
    )

    return answer_obj
