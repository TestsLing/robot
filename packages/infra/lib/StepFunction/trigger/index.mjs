import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const client = new SFNClient({});

const stateMachineArn = process.env.StateMachineArn;

export const handler = async (event) => {
  console.log(event.Records);

  for (const record of event.Records) {
    await client.send(
      new StartExecutionCommand({
        stateMachineArn,
        input: record.body,
      })
    );
  }
};
