import { Document } from "mongoose";

export interface Macro extends Document {
  readonly id: string;
  readonly name: string;
  readonly macro: string;
}
