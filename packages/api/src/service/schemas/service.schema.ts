import { Model, Schema } from "mongoose";

export const ServiceSchemaProvider = {
  name: "Service",
  useFactory: (): Schema => {
    const ClusterSchema = new Schema({
      name: {
        type: String,
        trim: true,
        minlength: 4,
      },
      configuration: {
        type: Schema.Types.Mixed,
      },
      creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    });
    return ClusterSchema;
  },
};
