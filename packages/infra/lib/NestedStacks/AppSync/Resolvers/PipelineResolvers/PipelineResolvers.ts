import * as cdk from "aws-cdk-lib";

import * as appsync from "aws-cdk-lib/aws-appsync";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";

import * as genai from "@cdklabs/generative-ai-cdk-constructs";

import { Construct } from "constructs";

interface IPipelineResolvers {
  ddbDataSource: appsync.DynamoDbDataSource;
  graphqlApi: appsync.GraphqlApi;
  archiveBucket: s3.Bucket;
  moveQueue: sqs.Queue;
  ddbTable: ddb.TableV2;
}

export class PipelineResolvers extends Construct {
  readonly ddbDataSource: appsync.DynamoDbDataSource;
  readonly graphqlApi: appsync.GraphqlApi;
  readonly archiveBucket: s3.Bucket;
  readonly ddbTable: ddb.TableV2;
  readonly moveQueue: sqs.Queue;
  readonly genaiLayer: genai.LangchainCommonDepsLayer;
  readonly bedrockConverseDataSource: appsync.HttpDataSource;

  constructor(
    scope: Construct,
    id: string,
    {
      ddbDataSource,
      graphqlApi,
      archiveBucket,
      moveQueue,
      ddbTable,
    }: IPipelineResolvers
  ) {
    super(scope, id);

    this.ddbDataSource = ddbDataSource;
    this.graphqlApi = graphqlApi;
    this.archiveBucket = archiveBucket;
    this.moveQueue = moveQueue;
    this.ddbTable = ddbTable;

    this.bedrockConverseDataSource = this.graphqlApi.addHttpDataSource(
      "Bedrock Converse DS",
      `https://bedrock-runtime.${cdk.Stack.of(this).region}.amazonaws.com`,
      {
        authorizationConfig: {
          signingRegion: cdk.Stack.of(this).region,
          signingServiceName: "bedrock",
        },
      }
    );
    this.bedrockConverseDataSource.grantPrincipal.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
      })
    );

    /*************************************************************/
    /************************ GenAI Layer ************************/
    /*************************************************************/

    this.genaiLayer = new genai.LangchainCommonDepsLayer(this, "Layer", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.PYTHON_3_12,
      autoUpgrade: true,
    });

    /*************************************************************/
    /************************* Mutations *************************/
    /*************************************************************/

    this.createSession();
    this.updateGameStatus();
    this.deleteSession();
    this.humanNewMove();
    this.postQuestion();
    this.commentatorQuestion();
  }

  createSession = () => {
    const typeName = "Mutation";
    const fieldName = "createSession";

    const sessionExist = new appsync.AppsyncFunction(this, "Session Exist", {
      name: "SessionExist",
      api: this.graphqlApi,
      dataSource: this.ddbDataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/sessionExist.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    const seedBoard = new appsync.AppsyncFunction(this, "Seed Board", {
      name: "SeedBoard",
      api: this.graphqlApi,
      dataSource: this.ddbDataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/seedBoard.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    const putSession = new appsync.AppsyncFunction(this, "Put New Session", {
      name: "PutSession",
      api: this.graphqlApi,
      dataSource: this.ddbDataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/putSession.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
      pipelineConfig: [sessionExist, seedBoard, putSession],
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      fieldName,
      typeName,
    });
  };

  updateGameStatus = () => {
    const typeName = "Mutation";
    const fieldName = "updateGameStatus";

    // Step 1: Get the last move record before proceeding
    const getLastMove = new appsync.AppsyncFunction(this, "Get Last Move", {
      name: "LastMove",
      api: this.graphqlApi,
      dataSource: this.ddbDataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/getLastMove.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    // Step 2: Update the session to the latest GameStatus
    const updateStatus = new appsync.AppsyncFunction(
      this,
      "Update Game Status",
      {
        name: "UpdateGameStatus",
        api: this.graphqlApi,
        dataSource: this.ddbDataSource,
        code: appsync.Code.fromAsset(
          __dirname + `/${typeName}/${fieldName}/updateStatus.mjs`
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    );

    // Step 3: Finally trigger the Step Function
    const triggerStepFunction = new lambda.Function(
      this,
      "Add To Queue (Trigger SF)",
      {
        code: lambda.Code.fromAsset(
          __dirname + `/${typeName}/${fieldName}/addMoveToQueue`
        ),
        handler: "index.handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: { MoveQueue: this.moveQueue.queueUrl },
      }
    );
    this.moveQueue.grantSendMessages(triggerStepFunction);

    const triggerSF = new appsync.AppsyncFunction(
      this,
      "Trigger SF by Adding to SQS",
      {
        name: "TriggerSF",
        api: this.graphqlApi,
        dataSource: new appsync.LambdaDataSource(this, "Trigger SF", {
          api: this.graphqlApi,
          lambdaFunction: triggerStepFunction,
        }),
        code: appsync.Code.fromAsset(
          __dirname + `/${typeName}/${fieldName}/addMoveToQueue.mjs`
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    );

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
      pipelineConfig: [getLastMove, updateStatus, triggerSF],
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      fieldName,
      typeName,
    });
  };

  deleteSession = () => {
    const typeName = "Mutation";
    const fieldName = "deleteSession";

    // Step 1: Delete all moves related to the session
    const recursivelyDeleteMoveRecords = new lambda.Function(
      this,
      "Delete Moves Fn",
      {
        code: lambda.Code.fromAsset(
          __dirname + `/${typeName}/${fieldName}/deleteMoves`
        ),
        handler: "index.handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          TableName: this.ddbTable.tableName,
          S3Bucket: this.archiveBucket.bucketName,
        },
      }
    );
    this.ddbTable.grantReadWriteData(recursivelyDeleteMoveRecords);
    this.archiveBucket.grantPut(recursivelyDeleteMoveRecords);

    const deleteMoves = new appsync.AppsyncFunction(this, "Delete Moves", {
      name: "DeleteMoves",
      api: this.graphqlApi,
      dataSource: new appsync.LambdaDataSource(this, "Delete Moves DS", {
        api: this.graphqlApi,
        lambdaFunction: recursivelyDeleteMoveRecords,
      }),
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/deleteMoves.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    // Step 2: Delete the session
    const deleteSession = new appsync.AppsyncFunction(this, "Delete Session", {
      name: "DeleteSession",
      api: this.graphqlApi,
      dataSource: this.ddbDataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/deleteSession.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
      pipelineConfig: [deleteMoves, deleteSession],
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      fieldName,
      typeName,
    });
  };

  humanNewMove = () => {
    const typeName = "Mutation";
    const fieldName = "humanNewMove";

    // Step 1: Pull the previous move and evaluate if move is legal
    const previousMove = new appsync.AppsyncFunction(this, "Previous Move", {
      name: "PreviousMove",
      api: this.graphqlApi,
      dataSource: this.ddbDataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/getLastMove.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    // Step 2: Add the new move to the queue to be processed
    const addMoveToQueue = new lambda.Function(this, "Add Move To Queue", {
      code: lambda.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/addMoveToQueue`
      ),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        MoveQueue: this.moveQueue.queueUrl,
      },
    });
    this.moveQueue.grantSendMessages(addMoveToQueue);
    const addMove = new appsync.AppsyncFunction(this, "Add Move AppSync JS", {
      name: "AddMove",
      api: this.graphqlApi,
      dataSource: new appsync.LambdaDataSource(this, "Add Move DS", {
        api: this.graphqlApi,
        lambdaFunction: addMoveToQueue,
      }),
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/addMoveToQueue.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
      pipelineConfig: [previousMove, addMove],
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      fieldName,
      typeName,
    });
  };

  postQuestion = () => {
    const typeName = "Mutation";
    const fieldName = "postQuestion";

    const invokeBedrock = new appsync.AppsyncFunction(this, "Invoke Bedrock", {
      name: "invokeBedrock",
      api: this.graphqlApi,
      dataSource: this.bedrockConverseDataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/invokeBedrock.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    const writeToDdb = new appsync.AppsyncFunction(this, "DynamoDB Write", {
      name: "DynamoDBWrite",
      api: this.graphqlApi,
      dataSource: this.ddbDataSource,
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/dynamoDBWrite.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
      pipelineConfig: [invokeBedrock, writeToDdb],
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      fieldName,
      typeName,
    });
  };

  commentatorQuestion = () => {
    const typeName = "Mutation";
    const fieldName = "commentatorQuestion";

    // Step 1: Post the question and trigger Bedrock
    const commentatorQuestionFunc = new lambda.Function(
      this,
      "Commentator Question",
      {
        code: lambda.Code.fromAsset(
          __dirname + `/${typeName}/${fieldName}/commentatorQuestion`
        ),
        handler: "index.handler",
        runtime: lambda.Runtime.PYTHON_3_12,
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.minutes(1),
        initialPolicy: [
          new iam.PolicyStatement({
            actions: ["bedrock:InvokeModel"],
            resources: ["*"],
          }),
        ],
        layers: [this.genaiLayer.layer],
      }
    );

    const commentatorQuestion = new appsync.AppsyncFunction(this, fieldName, {
      name: "commentatorQuestion",
      api: this.graphqlApi,
      dataSource: new appsync.LambdaDataSource(this, `${fieldName} DS`, {
        api: this.graphqlApi,
        lambdaFunction: commentatorQuestionFunc,
      }),
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/commentatorQuestion.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    this.graphqlApi.createResolver(`${fieldName} Unit Resolver`, {
      code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
      pipelineConfig: [commentatorQuestion],
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      fieldName,
      typeName,
    });
  };
}
