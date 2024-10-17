import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as genai from "@cdklabs/generative-ai-cdk-constructs";

import { AmplifyGraphqlApi } from "@aws-amplify/graphql-api-construct";

interface ICreateDataSources {
  self: any;
  appSyncApi: AmplifyGraphqlApi;
  moveQueue: sqs.Queue;
  ddbTable: ddb.TableV2;
  s3Bucket: s3.Bucket;
  BedrockRegion: string;
}

export const createDataSources = ({
  self,
  appSyncApi,
  moveQueue,
  ddbTable,
  s3Bucket,
  BedrockRegion,
}: ICreateDataSources): void => {
  let typeName: string;
  let fieldName: string;

  // DATA SOURCES
  const TableDataSource = new appsync.DynamoDbDataSource(
    self,
    "Table Connection",
    { api: appSyncApi.resources.graphqlApi, table: ddbTable }
  );

  // QUERY
  typeName = "Query";

  // UNIT RESOLVERS
  // listActiveSessions //
  fieldName = "listActiveSessions";

  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // listGamesByMoveCount //
  fieldName = "listGamesByMoveCount";

  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // listComments //
  fieldName = "listComments";
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // getSession //
  fieldName = "getSession";
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // getMoves //
  fieldName = "getMoves";
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // getLatestMove //
  fieldName = "getLatestMove";
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // MUTATION
  typeName = "Mutation";

  // UNIT RESOLVERS
  // verifySession //
  fieldName = "verifySession";
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // updateSession //
  fieldName = "updateSession";
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // createComment //
  fieldName = "createComment";
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // sendError //
  fieldName = "sendError";
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: new appsync.NoneDataSource(self, "None", {
      api: appSyncApi.resources.graphqlApi,
    }),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // updateLatestMove //
  fieldName = "updateLatestMove";
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    dataSource: TableDataSource,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(__dirname + `/${typeName}/${fieldName}.mjs`),
  });

  // PIPELINE RESOLVERS

  /***********************************************************************
   ************************* createSession *******************************
   **********************************************************************/

  fieldName = "createSession";
  // Step 1: Make sure session does not already exist
  const sessionExist = new appsync.AppsyncFunction(self, "Session Exist", {
    name: "SessionExist",
    api: appSyncApi.resources.graphqlApi,
    dataSource: TableDataSource,
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/sessionExist.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Step 2: Seed with the first move, which is the starting state
  const seedBoard = new appsync.AppsyncFunction(self, "Seed Board", {
    name: "SeedBoard",
    api: appSyncApi.resources.graphqlApi,
    dataSource: TableDataSource,
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/seedBoard.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Step 3: Write the newly created Session to DynamoDB
  const putSession = new appsync.AppsyncFunction(self, "Put New Session", {
    name: "PutSession",
    api: appSyncApi.resources.graphqlApi,
    dataSource: TableDataSource,
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/putSession.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Then chain them together with a resolver
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    pipelineConfig: [sessionExist, seedBoard, putSession],
    code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  /***********************************************************************
   ************************* createSession *******************************
   **********************************************************************/

  /***********************************************************************
   ************************* updateGameStatus ****************************
   **********************************************************************/

  fieldName = "updateGameStatus";
  // Step 1: Get the last move record before proceeding
  const getLastMove = new appsync.AppsyncFunction(self, "Get Last Move", {
    name: "LastMove",
    api: appSyncApi.resources.graphqlApi,
    dataSource: TableDataSource,
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/getLastMove.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Step 2: Update the session to the latest GameStatus
  const updateStatus = new appsync.AppsyncFunction(self, "Update Game Status", {
    name: "UpdateGameStatus",
    api: appSyncApi.resources.graphqlApi,
    dataSource: TableDataSource,
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/updateStatus.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Step 3: Finally trigger the Step Function
  const triggerStepFunction = new lambda.Function(
    self,
    "Add To Queue (Trigger SF)",
    {
      code: lambda.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/addMoveToQueue`
      ),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: { MoveQueue: moveQueue.queueUrl },
    }
  );
  moveQueue.grantSendMessages(triggerStepFunction);
  const triggerSF = new appsync.AppsyncFunction(
    self,
    "Trigger SF by Adding to SQS",
    {
      name: "TriggerSF",
      api: appSyncApi.resources.graphqlApi,
      dataSource: new appsync.LambdaDataSource(self, "Trigger SF", {
        api: appSyncApi.resources.graphqlApi,
        lambdaFunction: triggerStepFunction,
      }),
      code: appsync.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/addMoveToQueue.mjs`
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    }
  );

  // Then chain them together with a resolver
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    pipelineConfig: [getLastMove, updateStatus, triggerSF],
    code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  /***********************************************************************
   ************************* updateGameStatus ****************************
   **********************************************************************/

  /***********************************************************************
   ************************* deleteSession *******************************
   **********************************************************************/

  fieldName = "deleteSession";
  // Step 1: Delete all moves related to the session
  const recursivelyDeleteMoveRecords = new lambda.Function(
    self,
    "Delete Moves Fn",
    {
      code: lambda.Code.fromAsset(
        __dirname + `/${typeName}/${fieldName}/deleteMoves`
      ),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TableName: ddbTable.tableName,
        S3Bucket: s3Bucket.bucketName,
      },
    }
  );
  ddbTable.grantReadWriteData(recursivelyDeleteMoveRecords);
  s3Bucket.grantPut(recursivelyDeleteMoveRecords);
  const deleteMoves = new appsync.AppsyncFunction(self, "Delete Moves", {
    name: "DeleteMoves",
    api: appSyncApi.resources.graphqlApi,
    dataSource: new appsync.LambdaDataSource(self, "Delete Moves DS", {
      api: appSyncApi.resources.graphqlApi,
      lambdaFunction: recursivelyDeleteMoveRecords,
    }),
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/deleteMoves.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Step 2: Delete the session
  const deleteSession = new appsync.AppsyncFunction(self, "Delete Session", {
    name: "DeleteSession",
    api: appSyncApi.resources.graphqlApi,
    dataSource: TableDataSource,
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/deleteSession.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Then chain them together with a resolver
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    pipelineConfig: [deleteMoves, deleteSession],
    code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  /***********************************************************************
   ************************* deleteSession *******************************
   **********************************************************************/

  /***********************************************************************
   ************************* humanNewMove ********************************
   **********************************************************************/

  fieldName = "humanNewMove";

  // Step 1: Pull the previous move and evaluate if move is legal
  const previousMove = new appsync.AppsyncFunction(self, "Previous Move", {
    name: "PreviousMove",
    api: appSyncApi.resources.graphqlApi,
    dataSource: TableDataSource,
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/getLastMove.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Step 2: Add the new move to the queue to be processed
  const addMoveToQueue = new lambda.Function(self, "Add Move To Queue", {
    code: lambda.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/addMoveToQueue`
    ),
    handler: "index.handler",
    runtime: lambda.Runtime.NODEJS_20_X,
    environment: {
      MoveQueue: moveQueue.queueUrl,
    },
  });
  moveQueue.grantSendMessages(addMoveToQueue);
  const addMove = new appsync.AppsyncFunction(self, "Add Move AppSync JS", {
    name: "AddMove",
    api: appSyncApi.resources.graphqlApi,
    dataSource: new appsync.LambdaDataSource(self, "Add Move DS", {
      api: appSyncApi.resources.graphqlApi,
      lambdaFunction: addMoveToQueue,
    }),
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/addMoveToQueue.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Then chain them together with a resolver
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    pipelineConfig: [previousMove, addMove],
    code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  /***********************************************************************
   ************************* humanNewMove ********************************
   **********************************************************************/

  /***********************************************************************
   ************************* postQuestion ********************************
   **********************************************************************/

  const genaiLayer = new genai.LangchainCommonDepsLayer(self, "Layer", {
    architecture: lambda.Architecture.ARM_64,
    runtime: lambda.Runtime.PYTHON_3_12,
    autoUpgrade: true,
  }).layer;

  fieldName = "postQuestion";

  // Step 1: Post the question and trigger Bedrock
  const postQuestionFunc = new lambda.Function(self, "Post Question", {
    code: lambda.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/postQuestion`
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
    environment: {
      TableName: ddbTable.tableName,
      BedrockRegion,
    },
    layers: [genaiLayer],
  });
  ddbTable.grantWriteData(postQuestionFunc);

  const postQuestion = new appsync.AppsyncFunction(self, fieldName, {
    name: "PostQuestion",
    api: appSyncApi.resources.graphqlApi,
    dataSource: new appsync.LambdaDataSource(self, `${fieldName} DS`, {
      api: appSyncApi.resources.graphqlApi,
      lambdaFunction: postQuestionFunc,
    }),
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/postQuestion.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Then chain them together with a resolver
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    pipelineConfig: [postQuestion],
    code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  /***********************************************************************
   ************************* postQuestion ********************************
   **********************************************************************/

  /***********************************************************************
   ************************* commentatorQuestion *************************
   **********************************************************************/

  fieldName = "commentatorQuestion";

  // Step 1: Post the question and trigger Bedrock
  const commentatorQuestionFunc = new lambda.Function(
    self,
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
      layers: [genaiLayer],
      environment: {
        BedrockRegion,
      },
    }
  );

  const commentatorQuestion = new appsync.AppsyncFunction(self, fieldName, {
    name: "commentatorQuestion",
    api: appSyncApi.resources.graphqlApi,
    dataSource: new appsync.LambdaDataSource(self, `${fieldName} DS`, {
      api: appSyncApi.resources.graphqlApi,
      lambdaFunction: commentatorQuestionFunc,
    }),
    code: appsync.Code.fromAsset(
      __dirname + `/${typeName}/${fieldName}/commentatorQuestion.mjs`
    ),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  // Then chain them together with a resolver
  appSyncApi.addResolver(`${fieldName} Unit Resolver`, {
    typeName,
    fieldName,
    pipelineConfig: [commentatorQuestion],
    code: appsync.Code.fromAsset(__dirname + "/DefaultPipelineTemplate.mjs"),
    runtime: appsync.FunctionRuntime.JS_1_0_0,
  });

  /***********************************************************************
   ************************* commentatorQuestion *************************
   **********************************************************************/
};
