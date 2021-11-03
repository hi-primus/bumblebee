import { Model, Schema } from "mongoose";

export const MacroSchemaProvider = {
  name: "Macro",
  useFactory: (): Schema => {
    const MacroSchema = new Schema({
      name: {
        type: String,
        trim: true,
        minlength: 4,
      },
      macro: {
        type: Schema.Types.Mixed,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      }
    });
    return MacroSchema;
  },
};
