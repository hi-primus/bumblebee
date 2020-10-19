import { Document } from "mongoose";

export interface Service extends Document {
  readonly id: string;
  readonly name: string;
  readonly configuration: string;
}
