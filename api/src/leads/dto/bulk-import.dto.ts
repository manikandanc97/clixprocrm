import { IsArray, IsEnum } from 'class-validator';

export class BulkImportDto {
  @IsEnum(['skip', 'update', 'create'])
  duplicateStrategy: 'skip' | 'update' | 'create' = 'skip';

  @IsArray()
  leads: any[];
}
