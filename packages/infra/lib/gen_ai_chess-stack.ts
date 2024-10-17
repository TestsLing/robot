import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as pipes from "aws-cdk-lib/aws-pipes";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as cb from "aws-cdk-lib/aws-codebuild";
import * as triggers from "aws-cdk-lib/triggers";
import * as cc from "aws-cdk-lib/aws-codecommit";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as s3Assets from "aws-cdk-lib/aws-s3-assets";

import {
  AmplifyGraphqlApi,
  AmplifyGraphqlDefinition,
} from "@aws-amplify/graphql-api-construct";

import * as iot from "@aws-cdk/aws-iot-alpha";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import * as actions from "@aws-cdk/aws-iot-actions-alpha";

import { Construct } from "constructs";
import { createDataSources } from "./AppSync/appsync-resolvers";
import { createSFTaskChain } from "./StepFunction/stepfunction-tasks";

import {
  IdentityPool,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";

interface IGenAiChessStack extends cdk.StackProps {
  BedrockRegion: string;
}

export class GenAiChessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IGenAiChessStack) {
    super(scope, id, props);

    const { BedrockRegion } = props;

    const amplifyRepo = new cc.Repository(this, "Amplify Code", {
      repositoryName: this.stackName,
    });

    const { userPool, userPoolClient, identityPool } = this.createAuth();

    const moveQueue = new sqs.Queue(this, "Move Queue", {
      fifo: true,
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: new sqs.Queue(this, "DLQ", { fifo: true }),
      },
    });

    const { ddbTable } = this.createCentralisedDdb();

    const { appSyncApi } = this.createGraphQLApi(
      userPool,
      moveQueue,
      ddbTable,
      BedrockRegion
    );

    this.createStepFunction(moveQueue, appSyncApi, ddbTable, BedrockRegion);

    const { newBranch } = this.createAmplify(
      amplifyRepo,
      appSyncApi,
      userPool,
      userPoolClient,
      identityPool
    );

    this.node.tryGetContext("autoDeployUI") === "true" &&
      this.deployOnCdkLaunch(amplifyRepo, newBranch);

    // Outputted for those wanting to run locally
    new cdk.CfnOutput(this, "VITE_USERPOOLID", {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "VITE_USERPOOLCLIENTID", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "VITE_IDENTITYPOOLID", {
      value: identityPool.identityPoolId,
    });
    new cdk.CfnOutput(this, "VITE_APPSYNCAPI", {
      value: appSyncApi.graphqlUrl,
    });
  }

  createAuth = () => {
    const userPool = new cognito.UserPool(this, "User Pool", {
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      signInAliases: { email: true },
      userPoolName: this.stackName,
      selfSignUpEnabled: false,
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPool Client", {
      userPool,
    });

    const identityPool = new IdentityPool(this, "Identity Pool", {
      identityPoolName: this.stackName,
      authenticationProviders: {
        userPools: [
          new UserPoolAuthenticationProvider({
            userPool,
            userPoolClient,
          }),
        ],
      },
    });
    identityPool.authenticatedRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["polly:SynthesizeSpeech"],
        resources: ["*"],
      })
    );

    // Create Admin Group
    new cognito.CfnUserPoolGroup(this, "Admin Group", {
      description: "re:Invent 2024 Admin Group",
      userPoolId: userPool.userPoolId,
      groupName: "Admin",
    });

    return { userPool, userPoolClient, identityPool };
  };

  createCentralisedDdb = () => {
    const ddbTable = new ddb.TableV2(this, "Central Dynamodb Table", {
      partitionKey: {
        name: "SessionID",
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: ddb.AttributeType.STRING,
      },
      billing: ddb.Billing.onDemand(),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      globalSecondaryIndexes: [
        {
          indexName: "ListBySessionType",
          partitionKey: {
            name: "Type",
            type: ddb.AttributeType.STRING,
          },
          sortKey: {
            name: "SessionID",
            type: ddb.AttributeType.STRING,
          },
        },
        {
          indexName: "GamesByMoveCount",
          partitionKey: {
            name: "SK",
            type: ddb.AttributeType.STRING,
          },
          sortKey: {
            name: "MoveCount",
            type: ddb.AttributeType.NUMBER,
          },
        },
      ],
      localSecondaryIndexes: [
        {
          indexName: "SortByMoveCount",
          sortKey: {
            name: "MoveCount",
            type: ddb.AttributeType.NUMBER,
          },
        },
      ],
    });

    return { ddbTable };
  };

  createGraphQLApi = (
    userPool: cognito.UserPool,
    moveQueue: sqs.Queue,
    ddbTable: ddb.TableV2,
    BedrockRegion: string
  ) => {
    const appSyncApi = new AmplifyGraphqlApi(this, "GraphQL API", {
      definition: AmplifyGraphqlDefinition.fromFiles("schema.graphql"),
      apiName: this.stackName,
      authorizationModes: {
        defaultAuthorizationMode: "AMAZON_COGNITO_USER_POOLS",
        iamConfig: { enableIamAuthorizationMode: true },
        userPoolConfig: { userPool },
      },
    });

    const s3Bucket = new s3.Bucket(this, "Archive Bucket");

    createDataSources({
      self: this,
      appSyncApi,
      moveQueue,
      ddbTable,
      s3Bucket,
      BedrockRegion,
    });

    return { appSyncApi };
  };

  createStepFunction = (
    moveQueue: sqs.Queue,
    appSyncApi: AmplifyGraphqlApi,
    ddbTable: ddb.TableV2,
    BedrockRegion: string
  ) => {
    const inputTopic = "robo-chess/cloud/request";
    const outputTopic = "robo-chess/cloud/response";

    const definition = createSFTaskChain(
      this,
      moveQueue,
      appSyncApi,
      ddbTable,
      inputTopic,
      BedrockRegion
    );

    const moveSfn = new sfn.StateMachine(this, "Process Moves", {
      stateMachineName: this.stackName,
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
    });

    if (this.node.tryGetContext("iotDevice") === "true") {
      // When sending to the Robot
      new iot.TopicRule(this, "To Robot Arm", {
        sql: iot.IotSql.fromStringAsVer20160323(
          `SELECT * FROM '${inputTopic}'`
        ),
      });

      // Restart the Step Function with the Task Token
      const RobotCallback = new lambda.Function(this, "Robot Callback", {
        code: lambda.Code.fromAsset(__dirname + "/robotCallback"),
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
      });
      new iot.TopicRule(this, "From Robot Arm", {
        sql: iot.IotSql.fromStringAsVer20160323(
          `SELECT * FROM '${outputTopic}'`
        ),
        actions: [new actions.LambdaFunctionAction(RobotCallback)],
      });

      moveSfn.grantTaskResponse(RobotCallback);
    }

    // Pipes //
    const pipeRole = new iam.Role(this, "Pipes Role", {
      assumedBy: new iam.ServicePrincipal("pipes.amazonaws.com"),
    });
    moveQueue.grantConsumeMessages(pipeRole);
    moveSfn.grantStartExecution(pipeRole);

    const enrichmentFn = new lambda.Function(this, "Enrichment Lambda", {
      code: lambda.Code.fromInline(
        "exports.handler = async (event) => event[0].Message"
      ),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
    });
    enrichmentFn.grantInvoke(pipeRole);

    new pipes.CfnPipe(this, "Pipe Moves", {
      roleArn: pipeRole.roleArn,

      // Source
      source: moveQueue.queueArn,
      sourceParameters: {
        sqsQueueParameters: {
          batchSize: 1,
        },
      },

      // Enrichment
      enrichment: enrichmentFn.functionArn,
      enrichmentParameters: { inputTemplate: '{"Message": <$.body>}' },

      // Output
      target: moveSfn.stateMachineArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: "FIRE_AND_FORGET",
        },
      },
    });

    return { moveQueue };
  };

  createAmplify = (
    amplifyRepo: cc.Repository,
    appSyncApi: AmplifyGraphqlApi,
    userPool: cognito.UserPool,
    userPoolClient: cognito.UserPoolClient,
    identityPool: IdentityPool
  ) => {
    const amplifyApp = new amplify.App(this, this.stackName, {
      sourceCodeProvider: new amplify.CodeCommitSourceCodeProvider({
        repository: amplifyRepo,
      }),
      environmentVariables: {
        REGION: this.region,
        USER_POOL_ID: userPool.userPoolId,
        APPSYNC_API: appSyncApi.graphqlUrl,
        IDENTITY_POOL_ID: identityPool.identityPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      customRules: [
        new amplify.CustomRule({
          target: "/index.html",
          status: amplify.RedirectStatus.REWRITE,
          source:
            "</^[^.]+$|\\.(?!(css|gif|hdr|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|gltf|glb|wasm)$)([^.]+$)/>",
        }),
      ],
    });
    const newBranch = amplifyApp.addBranch("main");

    return { newBranch };
  };

  deployOnCdkLaunch = (
    amplifyRepo: cc.Repository,
    newBranch: amplify.Branch
  ) => {
    const asset = new s3Assets.Asset(this, "Code Asset", {
      path: "../../../reinvent-genai-chess-robot",
      exclude: [
        "iot-infra-web-app",
        "node_modules",
        "cdk.out",
        "build",
        ".git",
        ".env",
      ],
    });

    const commitCode = new cb.Project(this, "Commit Code", {
      source: cb.Source.s3({
        bucket: asset.bucket,
        path: asset.s3ObjectKey,
      }),
      // environment: {
      //   buildImage: cb.LinuxLambdaBuildImage.AMAZON_LINUX_2_NODE_18,
      // },
      buildSpec: cb.BuildSpec.fromObject({
        version: "0.2",
        env: { "git-credential-helper": "yes" },
        phases: {
          pre_build: {
            commands: [
              'git config --global user.email "Amazon CodeBuild"',
              'git config --global user.name "Amazon CodeBuild"',
            ],
          },
          build: {
            commands: [
              `git clone ${amplifyRepo.repositoryCloneUrlHttp} --no-checkout`,
              `mv ${amplifyRepo.repositoryName}/.git .`,
              `rm -rf ${amplifyRepo.repositoryName}`,
              "git add .",
              "git commit -m '$CODEBUILD_BUILD_ID'",
              "git branch -M main",
              "git push -u origin main",
            ],
          },
        },
      }),
    });
    amplifyRepo.grantPullPush(commitCode);

    new triggers.TriggerFunction(this, "New Code", {
      code: lambda.Code.fromAsset(__dirname + "/new-code-detected"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["codebuild:StartBuild"],
          resources: [commitCode.projectArn],
        }),
      ],
      environment: {
        hash: asset.assetHash,
        projectName: commitCode.projectName,
      },
      executeAfter: [amplifyRepo, newBranch],
    });
  };
}
