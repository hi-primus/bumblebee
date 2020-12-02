import { IsUUID } from "class-validator";

export class PreferedWorkspaceSettingDTO {
  @IsUUID()
  workspaceId: string;
}
