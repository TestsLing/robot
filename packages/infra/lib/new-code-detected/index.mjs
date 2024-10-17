import { CodeBuildClient, StartBuildCommand } from "@aws-sdk/client-codebuild"; // ES Modules import

const client = new CodeBuildClient({});

export const handler = async (event) => {
  await client.send(
    new StartBuildCommand({
      projectName: process.env.projectName,
    })
  );
};
