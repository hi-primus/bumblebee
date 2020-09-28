import { Document } from "mongoose";

export interface Cluster extends Document {
  readonly id: string;
  readonly name: string;
  readonly configuration: string;
}
