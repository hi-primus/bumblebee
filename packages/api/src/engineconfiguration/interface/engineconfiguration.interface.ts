import { Document } from "mongoose";

export interface EngineConfiguration extends Document {
  readonly id: string;
  readonly name: string;
  readonly configuration: string;
}
