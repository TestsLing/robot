import os
import json
import chess
import boto3
import random
from stockfish import Stockfish
from utils import send_to_appsync
from models.meta import callLlama
from models.amazon import callTitan
from models.ai21 import callJurrasic
from models.cohere import callCommand
from models.anthropic import callClaude
from models.mistral_ai import callMistral

bedrock_client = boto3.client(
    "bedrock-runtime", region_name=os.environ["BedrockRegion"]
)


def handler(event, context):
    print(event)
    latest_move = event["LatestMove"]["Item"]
    current_fen = latest_move["Move"]["S"]
    current_board = chess.Board(current_fen)
    print(current_board, "STARTING BOARD")

    # Parse input SanList
    san_list = latest_move["SanList"]["S"] if "SanList" in latest_move else None
    print(san_list, "SAN LIST")

    # True = White
    # False = Black
    print(current_board.turn)
    turn = current_board.turn
    model_id = (
        event["Session"]["Item"]["WhiteID"]["S"]
        if turn
        else event["Session"]["Item"]["BlackID"]["S"]
    )

    print(model_id)
    next_move, justification, message_attempts = predict_next_move(
        model_id, san_list, current_board
    )

    print("Next Move:\t" + next_move)
    print("Justification:\t" + justification)

    send_to_appsync(
        event["SessionID"], justification, f'{model_id}#{"w" if turn else "b"}'
    )
    print(current_board, "END BOARD")

    next_move_num = int(event["LatestMove"]["Item"]["MoveCount"]["N"]) + 1
    next_san_list = f"{san_list if san_list else ''}{str(next_move_num)}. {next_move} "

    return {
        "SanList": next_san_list,
        "Move": current_board.fen(),
        "Messages": message_attempts,
    }


def predict_next_move(model_id, san_list, board):
    message_attempts = []
    accept = "application/json"
    contentType = "application/json"

    for tries in range(3):
        if model_id.startswith("amazon"):
            next_move, justification, message_attempts = callTitan(
                board, model_id, bedrock_client, tries, message_attempts
            )

        elif model_id.startswith("anthropic"):
            next_move, justification, message_attempts = callClaude(
                board, model_id, bedrock_client, tries, message_attempts
            )

        elif model_id.startswith("ai21"):
            next_move, justification, message_attempts = callJurrasic(
                board, model_id, bedrock_client, tries, message_attempts
            )

        elif model_id.startswith("cohere"):
            next_move, justification, message_attempts = callCommand(
                board, model_id, bedrock_client, tries, message_attempts
            )

        elif model_id.startswith("meta"):
            next_move, justification, message_attempts = callLlama(
                board, model_id, bedrock_client, tries, message_attempts
            )

        elif model_id.startswith("mistral"):
            next_move, justification, message_attempts = callMistral(
                board, model_id, bedrock_client, tries, message_attempts
            )

        else:
            raise Exception(f"model_id not supported {model_id}")

        try:
            print(f"Validating move: {next_move}")
            board.push_san(next_move)
            print(f"The move is valid after {tries+1} tries")

            return (next_move, justification, message_attempts)
        except Exception as e:
            print(f"Move not valid: {next_move}")
            print(f"Exception Generated: {str(e)}")

    # If number of tries is > 3 - then generate a random move
    print("Looks like I need a little help... lets make a random")

    stockfish = Stockfish("/opt/bin/stockfish")
    stockfish.set_fen_position(board.fen())
    best_move = stockfish.get_best_move()
    stockfish_move = board.san(chess.Move.from_uci(best_move))

    print(f"Stockfish: {stockfish_move}")
    board.push_san(stockfish_move)

    system_prompt = (
        "You are a commentator on the game of chess. You provide short justification as to why certain moves are logical to win the game. The current Forsyth-Edwards Notation (FEN) of the chess board is %s."
        % board.fen()
    )

    user_message = {
        "role": "user",
        "content": "Generate a short justification, 50 words or less, as to why the following Standard Algebraic Notation (SAN) move, %s, in the game of chess is a smart move when the current state of the board describe by the following Forsyth-Edwards Notation (FEN), %s"
        % (stockfish_move, board.fen()),
    }

    messages = [user_message]

    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 200,
            "system": system_prompt,
            "messages": messages,
        }
    )

    response = bedrock_client.invoke_model(
        body=body, modelId="anthropic.claude-3-sonnet-20240229-v1:0"
    )
    response_body = json.loads(response.get("body").read())
    justification = (
        response_body["content"][0]["text"].replace("\n", "").replace('"', "")
    )

    print(f"Stockfish move generated after {tries+1} to make a legal move.")

    return (stockfish_move, justification, message_attempts)
