import { Model, Schema } from "mongoose";

export const ConnectionSchemaProvider = {
  name: "Connection",
  useFactory: (): Schema => {
    const ConnectionSchema = new Schema({
      name: {
        type: String,
        trim: true,
        minlength: 4,
      },
      isDatabase: {
        type: Boolean,
        default: false
      },
      configuration: {
        type: Schema.Types.Mixed,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    });
    return ConnectionSchema;
  },
};
