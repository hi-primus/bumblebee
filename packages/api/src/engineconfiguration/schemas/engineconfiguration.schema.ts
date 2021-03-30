import { Model, Schema } from "mongoose";

export const EngineConfigurationSchemaProvider = {
  name: "EngineConfiguration",
  useFactory: (): Schema => {
    const EngineConfigurationSchema = new Schema({
      name: {
        type: String,
        trim: true,
        minlength: 4,
      },
      configuration: {
        type: Schema.Types.Mixed,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      preferred: {
        type: Boolean,
        default: false,
      },
    });
    return EngineConfigurationSchema;
  },
};
