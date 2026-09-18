import { DealStage } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class ConvertLeadDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsBoolean()
  createDeal?: boolean;

  @IsOptional()
  @IsString()
  dealName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dealValue?: number;

  @IsOptional()
  @IsEnum(DealStage)
  dealStage?: DealStage;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  probability?: number;

  @IsOptional()
  @IsString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;
}
