import os
import requests
from requests_aws4auth import AWS4Auth

graphql_url = os.environ["GRAPHQL_URL"]
session = requests.Session()
session.auth = AWS4Auth(
    os.environ["AWS_ACCESS_KEY_ID"],
    os.environ["AWS_SECRET_ACCESS_KEY"],
    os.environ["AWS_REGION"],
    "appsync",
    session_token=os.environ["AWS_SESSION_TOKEN"],
)


def send_to_appsync(SessionID, Comment, Author):
    Comment = Comment.replace('"', "'")

    query = """
    mutation CreateComment {
        createComment(input: {SessionID: "%s", Comment: "%s", Author: "%s"}) {
            SK
            Comment
            Author
            SessionID
        } 
    }
    """ % (
        SessionID,
        Comment,
        Author,
    )

    response = session.request(url=graphql_url, method="POST", json={"query": query})
    resp = response.json()
    print(resp)

    if "errors" in resp:
        raise Exception(resp)

    return resp
