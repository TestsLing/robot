import os
import json
import chess
import boto3
import random

from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools import Logger, Tracer
from custom_model import custom_model
from custom_model import generate_justification
from utils import send_to_appsync
from stockfish import Stockfish

bedrock_runtime = boto3.client("bedrock-runtime")

logger = Logger()
tracer = Tracer()


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
def handler(event: dict, context: LambdaContext) -> str:
    latest_move = event["LatestMove"]["Item"]
    current_fen = latest_move["Move"]["S"]
    current_board = chess.Board(current_fen)
    # logger.info(current_board)
    print(f"FEN as received: {current_fen}")
    print(f"Current Board: {current_board}")

    # Parse input SanList
    san_list = latest_move["SanList"]["S"] if "SanList" in latest_move else None
    print(san_list, "SAN LIST")

    # ***************************************************************** #
    # ***************************** Turn ****************************** #
    # ***************************************************************** #

    # True means it's white's turn false if Black
    logger.info(current_board.turn)
    turn = current_board.turn
    model_id = (
        event["Session"]["Item"]["WhiteID"]["S"]
        if turn
        else event["Session"]["Item"]["BlackID"]["S"]
    )
    logger.info(f"Generating move with model {model_id}")

    # ***************************************************************** #
    # ************************* Predict Move ************************** #
    # ***************************************************************** #

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
    original_board = board
    # Prefix the Justification with board player color for readability in the UI
    current_fen = original_board.fen()
    color_indicator = current_fen.split()[1]
    # Convert 'w' or 'b' to full word
    next_move_color = "WHITE" if color_indicator == "w" else "BLACK"

    # Flow corresponds to imported model
    print(f"Predicting next move for imported-model {model_id}")
    for tries in range(5):
        next_move, justification, message_attempts = custom_model(
            board, model_id, tries, message_attempts
        )

        try:
            print(f"Validating move: {next_move}")
            board.push_san(next_move)
            if not justification or justification.strip() == "":
                print(f"Justification not generated")
                justification = generate_justification(original_board, next_move)
            print(f"The move is valid after {tries + 1} tries")
            return (next_move, justification, message_attempts)
        except Exception as e:
            logger.info(f"Illegal Move: {next_move}")
            logger.info(e)

    # If number of tries is > 5 - then generate a random move
    print("Looks like I need a little help... lets make a random")

    stockfish = Stockfish("/opt/bin/stockfish")
    stockfish.set_fen_position(board.fen())
    best_move = stockfish.get_best_move()
    stockfish_move = board.san(chess.Move.from_uci(best_move))

    print(f"Stockfish: {stockfish_move}")
    board.push_san(stockfish_move)

    justification = (
        "Helper(CMI) - "
        + next_move_color
        + ": "
        + generate_justification(original_board, stockfish_move)
    )

    print(f"Stockfish move generated after {tries+1} to make a legal move.")

    return (stockfish_move, justification, message_attempts)
