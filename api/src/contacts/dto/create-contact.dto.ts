import { CustomerStatus } from '@prisma/client';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Company is required' })
  company: string;

  @IsOptional()
  @ValidateIf((o) => o.email !== '')
  @IsEmail({}, { message: 'Invalid email' })
  email?: string;

  @IsOptional()
  revenue?: string | number;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
