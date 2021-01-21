import { Document } from "mongoose";

export interface Connection extends Document {
  readonly id: string;
  readonly name: string;
  readonly configuration: string;
  readonly isDatabase: string;
}
