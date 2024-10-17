import { AmplifyGraphqlApi } from "@aws-amplify/graphql-api-construct";
import {
  aws_lambda as lambda,
  aws_appsync as appsync,
  aws_dynamodb as ddb,
  aws_stepfunctions_tasks as tasks,
  aws_stepfunctions as sfn,
  aws_sqs as sqs,
  aws_iam as iam,
  Duration,
} from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export const createSFTaskChain = (
  self: any,
  moveQueue: sqs.Queue,
  appSyncApi: AmplifyGraphqlApi,
  ddbTable: ddb.TableV2,
  inputTopic: string,
  BedrockRegion: string
) => {
  // STEP 0: Clean the input
  const cleanUpInput = new sfn.Pass(self, "Clean Up Input", {
    inputPath: "$.[0]",
  });

  // STEP 1: Get the corresponding Session Record
  const getSession = new tasks.DynamoGetItem(self, "Get Session", {
    table: ddbTable,
    key: {
      SessionID: tasks.DynamoAttributeValue.fromString(
        sfn.JsonPath.stringAt("$.SessionID")
      ),
      SK: tasks.DynamoAttributeValue.fromString("SESSION"),
    },
    resultSelector: { Item: sfn.JsonPath.stringAt("$.Item") },
    resultPath: "$.Session",
  });

  // STEP 2: Get latest Move Record
  const getLatestMove = new tasks.DynamoGetItem(self, "Get Latest Move", {
    table: ddbTable,
    key: {
      SessionID: tasks.DynamoAttributeValue.fromString(
        sfn.JsonPath.stringAt("$.SessionID")
      ),
      SK: tasks.DynamoAttributeValue.fromString("MOVE#LATEST"),
    },
    resultSelector: { Item: sfn.JsonPath.stringAt("$.Item") },
    resultPath: "$.LatestMove",
  });

  // STEP 3a: Find who the primary actor (Player or GenAI)?
  const findTurnActor = new tasks.EvaluateExpression(
    self,
    "Extract Next Player",
    {
      expression:
        '($.LatestMove.Item.Move.S).split(" ")[1] === "w" ? $.Session.Item.White.S : $.Session.Item.Black.S',
      runtime: lambda.Runtime.NODEJS_18_X,
      resultPath: "$.TurnActor",
    }
  );

  // STEP 4a: If it's a start game command, and the actor is a GenAI bot, trigger it to make a move
  // If the actor is a human, do nothing as the human will independently trigger the move from the FE
  const genAIMove = new lambda.Function(self, "Trigger GenAI", {
    code: lambda.Code.fromAsset(__dirname + "/genaiNewMove"),
    runtime: lambda.Runtime.PYTHON_3_11,
    handler: "index.handler",
    timeout: Duration.minutes(1),
    memorySize: 1024,
    environment: {
      GRAPHQL_URL: appSyncApi.graphqlUrl,
      BedrockRegion,
    },
    layers: [
      new lambda.LayerVersion(self, "Python Libraries", {
        code: lambda.Code.fromAsset(__dirname + "/genaiNewMovePackages"),
      }),
    ],
    initialPolicy: [
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
      }),
    ],
  });

  const triggerGenAIToMakeMove = new tasks.LambdaInvoke(self, "GenAI", {
    lambdaFunction: genAIMove,
    payloadResponseOnly: true,
    resultPath: "$.PlayerOutput",
  });
  appSyncApi.resources.graphqlApi.grantMutation(genAIMove);

  // Step 4a: If it's a random move, make a random move
  const randomMove = new NodejsFunction(self, "Trigger Random Move", {
    entry: __dirname + "/randomNewMove/index.mjs",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: { MoveQueue: moveQueue.queueUrl },
    initialPolicy: [
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
      }),
    ],
  });
  const triggerRandomMove = new tasks.LambdaInvoke(self, "Random", {
    lambdaFunction: randomMove,
    payloadResponseOnly: true,
  });

  // Chess Engine
  const chessEngine = new NodejsFunction(self, "Chess Engine Function", {
    entry: __dirname + "/chessEngineNewMove/index.mjs",
    runtime: lambda.Runtime.NODEJS_20_X,
    bundling: {
      nodeModules: ["js-chess-engine"],
    },
    timeout: Duration.minutes(1),
  });
  const chessEngineTask = new tasks.LambdaInvoke(self, "Chess Engine", {
    lambdaFunction: chessEngine,
    payloadResponseOnly: true,
  });

  let startIoTSessionTask;
  let sendMoveToRobotArmTask;
  if (self.node.tryGetContext("iotDevice") === "true") {
    // Step 1b: Call only on the initialisation of the board
    const startIoTSession = new NodejsFunction(self, "Initialise IoT", {
      entry: __dirname + "/initialiseIoT/index.mjs",
      bundling: {
        externalModules: ["@aws-sdk/client-iot-data-plane"],
      },
      environment: { topicRule: inputTopic },
      timeout: Duration.seconds(30),
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["iot:Publish", "iot:Connect"],
          resources: ["*"],
        }),
      ],
    });
    startIoTSessionTask = new tasks.LambdaInvoke(self, "Send Initialise IoT", {
      lambdaFunction: startIoTSession,
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      resultPath: sfn.JsonPath.DISCARD,
      payload: sfn.TaskInput.fromObject({
        input: sfn.JsonPath.objectAt("$"),
        taskToken: sfn.JsonPath.taskToken,
      }),
    });

    // Step 3b: Send this move to the RobotArm
    const sendMoveToRobotArm = new NodejsFunction(self, "Send Move to Device", {
      entry: __dirname + "/toRobotArm/index.mjs",
      bundling: {
        externalModules: [
          "@aws-sdk/client-iot-data-plane",
          "@aws-sdk/signature-v4",
          "@aws-sdk/protocol-http",
        ],
      },
      environment: {
        topicRule: inputTopic,
        GRAPHQL_URL: appSyncApi.graphqlUrl,
      },
      timeout: Duration.seconds(30),
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["iot:Publish", "iot:Connect"],
          resources: ["*"],
        }),
      ],
    });
    appSyncApi.resources.graphqlApi.grantMutation(sendMoveToRobotArm);
    sendMoveToRobotArmTask = new tasks.LambdaInvoke(self, "Send Move IoT", {
      lambdaFunction: sendMoveToRobotArm,
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      resultPath: sfn.JsonPath.DISCARD,
      payload: sfn.TaskInput.fromObject({
        input: sfn.JsonPath.objectAt("$"),
        taskToken: sfn.JsonPath.taskToken,
      }),
    });
  }

  // Step 4b: Process the MOVE in GameStatus PLAYING
  const callback = new NodejsFunction(self, "Callback Func", {
    entry: __dirname + "/callback/index.mjs",
    runtime: lambda.Runtime.NODEJS_20_X,
    timeout: Duration.seconds(20),
    environment: {
      TableName: ddbTable.tableName,
      GRAPHQL_URL: appSyncApi.graphqlUrl,
    },
    bundling: {
      externalModules: [
        "@aws-sdk/client-dynamodb",
        "@aws-sdk/protocol-http",
        "@aws-sdk/signature-v4",
      ],
    },
  });
  const CallbackTask = new tasks.LambdaInvoke(self, "Callback (Write to Ddb)", {
    lambdaFunction: callback,
    payloadResponseOnly: true,
    payload: sfn.TaskInput.fromObject({
      input: sfn.JsonPath.objectAt("$"),
      executionId: sfn.JsonPath.executionId,
    }),
  });
  ddbTable.grantWriteData(callback);
  appSyncApi.resources.graphqlApi.grantMutation(callback);

  // Step 5b: Is Game over
  const isGameOver = new NodejsFunction(self, "Game Over Function", {
    entry: __dirname + "/gameOver/index.mjs",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: { GRAPHQL_URL: appSyncApi.graphqlUrl },
    bundling: {
      externalModules: ["@aws-sdk/protocol-http", "@aws-sdk/signature-v4"],
    },
  });
  const isGameOverTask = new tasks.LambdaInvoke(self, "Game Over", {
    lambdaFunction: isGameOver,
    payloadResponseOnly: true,
  });
  appSyncApi.resources.graphqlApi.grantMutation(isGameOver);

  // Lock the move
  const lockMove = new NodejsFunction(self, "Lock Move Func", {
    entry: __dirname + "/lockMove/index.mjs",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: { GRAPHQL_URL: appSyncApi.graphqlUrl },
    bundling: {
      externalModules: ["@aws-sdk/protocol-http", "@aws-sdk/signature-v4"],
    },
    timeout: Duration.seconds(30),
  });
  const lockMoveTask = new tasks.LambdaInvoke(self, "Lock Move", {
    lambdaFunction: lockMove,
    payload: sfn.TaskInput.fromObject({
      input: sfn.JsonPath.objectAt("$"),
      executionId: sfn.JsonPath.executionId,
    }),
    resultPath: sfn.JsonPath.DISCARD,
  });
  appSyncApi.resources.graphqlApi.grantMutation(lockMove);

  const humanMove = new NodejsFunction(self, "Human Move Func", {
    entry: __dirname + "/humanNewMove/index.mjs",
    runtime: lambda.Runtime.NODEJS_20_X,
  });
  const humanMoveTask = new tasks.LambdaInvoke(self, "Human Move", {
    lambdaFunction: humanMove,
    payloadResponseOnly: true,
    resultPath: "$.PlayerOutput",
  });

  const definition = getSession.next(getLatestMove).next(
    new sfn.Choice(self, "Is GamePlay Valid?", {
      comment: "Is the call for a move allowed to proceed",
    })
      .when(
        sfn.Condition.not(
          sfn.Condition.stringEquals("$.Session.Item.GameStatus.S", "PLAYING")
        ),
        new sfn.Fail(self, "GameStatus !== PLAYING", {
          error: "GAMESTATUS_NOT_PLAYING",
          cause: JSON.stringify({
            message:
              "The game status of this game is not currently playing. Please check the Session record to see what the GameStatus is",
          }),
        })
      )
      .when(
        sfn.Condition.isPresent("$.LatestMove.Item.SfnExecutionId.S"),
        new sfn.Fail(self, "Move Already In Progress", {
          error: "MOVE_ALREADY_IN_PROGRESS",
          cause: JSON.stringify({
            message:
              "Another State Machine is currently handling this move, please refer to the move record to see which state machine this is",
          }),
        })
      )
      .otherwise(
        (startIoTSessionTask
          ? new sfn.Choice(self, "Initialise Board?", {
              comment: "Only perform this once to init the board",
            })
              .when(
                sfn.Condition.stringEquals(
                  "$.LatestMove.Item.Action.S",
                  "INITIALISE_BOARD"
                ),
                startIoTSessionTask.next(findTurnActor)
              )
              .otherwise(findTurnActor)
              .afterwards()
          : findTurnActor
        )
          .next(
            new sfn.Choice(self, "Await Human?", {
              comment:
                "If it's human's turn and they haven't inputted a move wait",
            })
              .when(
                sfn.Condition.and(
                  sfn.Condition.stringEquals("$.TurnActor", "player"),
                  sfn.Condition.not(sfn.Condition.isPresent("$.Move"))
                ),
                new sfn.Succeed(self, "Await Human", {
                  comment: "Wait for the human to make a move",
                })
              )
              .otherwise(lockMoveTask)
              .afterwards()
          )
          .next(
            new sfn.Choice(
              self,
              "Player, GenAI, Random or Chess Engine Move?",
              {
                comment: "Who's turn is it to play",
              }
            )
              .when(
                sfn.Condition.stringEquals("$.TurnActor", "player"),
                humanMoveTask
              )
              .when(
                sfn.Condition.stringEquals("$.TurnActor", "genai"),
                triggerGenAIToMakeMove
              )
              .when(
                sfn.Condition.stringEquals("$.TurnActor", "random"),
                triggerRandomMove
              )
              .when(
                sfn.Condition.stringEquals("$.TurnActor", "chessengine"),
                chessEngineTask
              )
              .afterwards()
          )
          .next(
            sendMoveToRobotArmTask
              ? sendMoveToRobotArmTask.next(CallbackTask)
              : CallbackTask
          )
          .next(
            new sfn.Choice(self, "Is Game Over?")
              .when(
                sfn.Condition.booleanEquals("$.IsGameOver", false),
                new tasks.SqsSendMessage(self, "Send Next Move", {
                  queue: moveQueue,
                  messageBody: sfn.TaskInput.fromObject([
                    { SessionID: sfn.JsonPath.stringAt("$.SessionID") },
                  ]),
                  messageGroupId: sfn.JsonPath.stringAt("$.SessionID"),
                  messageDeduplicationId:
                    sfn.JsonPath.stringAt("$$.Execution.Id"),
                })
              )
              .otherwise(isGameOverTask)
          )
      )
  );

  // Catch Error
  const catchError = new NodejsFunction(self, "Catch Error Func", {
    entry: __dirname + "/catchError/index.mjs",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: {
      GRAPHQL_URL: appSyncApi.graphqlUrl,
      TableName: ddbTable.tableName,
    },
    bundling: {
      externalModules: [
        "@aws-sdk/protocol-http",
        "@aws-sdk/signature-v4",
        "@aws-sdk/client-dynamodb",
        "@aws-sdk/lib-dynamodb",
      ],
    },
    timeout: Duration.seconds(30),
  });
  const catchErrorTask = new tasks.LambdaInvoke(self, "Catch Error", {
    lambdaFunction: catchError,
  });
  appSyncApi.resources.graphqlApi.grantMutation(catchError);
  ddbTable.grantWriteData(catchError);

  const executeMoveJob = new sfn.Parallel(self, "Execute Move").branch(
    definition
  );
  executeMoveJob.addCatch(catchErrorTask, {
    resultPath: sfn.JsonPath.stringAt("$.ErrorInfo"),
  });

  return cleanUpInput.next(executeMoveJob);
};
