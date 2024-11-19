import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export const request = (ctx) => {
  const { SessionID, ...items } = ctx.arguments.input;

  return dynamodbPutRequest({ SessionID, items });
};

export const response = (ctx) => {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type, result);
  }
  return result;
};

const dynamodbPutRequest = ({ SessionID, items }) => {
  const item = {
    ...items,
  };

  const datetime = util.time.nowFormatted("yyyy-MM-dd HH:mm:ss");
  const key = { SessionID, SK: `MOVE#${datetime}` };

  return ddb.put({ key, item });
};
