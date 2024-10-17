#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GenAiChessStack } from "../lib/gen_ai_chess-stack";

const app = new cdk.App();
new GenAiChessStack(app, "RobotArmsGenAIChess", {
  // What region would you like all Bedrock calls to go to
  BedrockRegion: "us-west-2",
});
