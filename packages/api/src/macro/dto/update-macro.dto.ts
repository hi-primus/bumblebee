import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString, IsBoolean } from "class-validator";
export class UpdateMacroDTO {
  @ApiProperty({ example: "Macro 1" })
  @IsString()
  name: string;
  @ApiProperty({
    example: {
      "property": "value",
    },
  })
  @IsMongoId()
  configuration: any;
  @IsBoolean()
  isDatabase: boolean;
}
