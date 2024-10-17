import json


def callMistral(board, model_id, bedrock_client, tries, message_attempts):
    # Increase temperature if the previous generated move was not a legal move
    if tries == 0:
        temperature = 0.6
    else:
        temperature = 0.6 + 0.7 ** (10 / tries)

    prompt = (
        "You are chess player playing a game of chess. The current Forsyth-Edwards Notation (FEN) of the chess board is %s. Generate the next valid move in Standard Algebraic Notation (SAN) to win the game of chess. Provide the move in <move></move> XML tags and provide a short justification, 50 words or less, as to why you believe this is the best move in <reason></reason> XML tags."
        % board.fen()
    )

    body = json.dumps(
        {
            "prompt": prompt,
            "max_tokens": 400,
            "temperature": temperature,
            "top_p": 0.7,
            "top_k": 50,
        }
    )

    response = bedrock_client.invoke_model(body=body, modelId=model_id)
    response_body = json.loads(response.get("body").read())

    print(f"{model_id} attempt {tries}")
    print(response_body)

    message_attempts.append(
        {
            "prompt": prompt,
            "response_body": response_body,
        }
    )

    try:
        next_move = (
            response_body["outputs"][0]["text"]
            .split("<move>")[1]
            .split("</move>")[0]
            .strip()
        )
        justification = response_body["outputs"][0]["text"].replace("\n", "")
    except:
        next_move = None
        justification = None

    return (next_move, justification, message_attempts)
