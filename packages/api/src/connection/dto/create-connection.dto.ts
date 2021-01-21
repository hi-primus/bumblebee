import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString } from "class-validator";
export class CreateConnectionDTO {
  @ApiProperty({ example: "Connection 1" })
  @IsString()
  name: string;
  @ApiProperty({
    example: {
      "property": "value",
    },
  })
  @IsMongoId()
  configuration: object;
}
