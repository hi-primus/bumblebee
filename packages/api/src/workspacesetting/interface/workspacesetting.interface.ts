import { Document } from "mongoose";

export interface WorkspaceSetting extends Document {
  readonly id: string;
  readonly name: string;
  readonly configuration: string;
}
