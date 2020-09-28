import mongoose, { Model, Schema } from "mongoose";

export const ClusterSchemaProvider = {
  name: "Cluster",
  useFactory: (): Model<any> => {
    const ClusterSchema = new Schema({
      name: {
        type: String,
        trim: true,
        minlength: 4,
      },
      configuration: {
        type: Schema.Types.Mixed,
      },
    });
    return ClusterSchema;
  },
};
