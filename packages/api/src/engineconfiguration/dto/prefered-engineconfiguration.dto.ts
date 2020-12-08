import { IsUUID } from "class-validator";

export class PreferedEngineConfigurationDTO {
  @IsUUID()
  workspaceId: string;
}
