import { IsOptional, IsString, IsObject } from "class-validator";

export class SaveDraftDto {
  @IsOptional()
  @IsString()
  note?: string;
  // draftData sẽ là JSON bất kỳ (schema validate ở web-admin)

  @IsObject()
  draftData: Record<string, any>;
 
 
  
}
