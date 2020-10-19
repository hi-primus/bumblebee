import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString } from "class-validator";
export class CreateWorkspaceSettingDTO {
  @ApiProperty({ example: "WorkspaceSetting 1" })
  @IsString()
  name: string;
  @ApiProperty({
    example: {
      "Propiedad 1": "Valor 1",
    },
  })
  @IsMongoId()
  configuration: object;
}
