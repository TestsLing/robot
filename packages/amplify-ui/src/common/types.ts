import { AlertProps } from "@cloudscape-design/components";

export interface ISession {
  SessionID: string;
  Type: string;
  White: string;
  WhiteID: string;
  Black: string;
  BlackID: string;
  GameStatus: string;
}

export interface IAlertStatus {
  visible: boolean;
  msg: string;
  type: AlertProps.Type;
}
