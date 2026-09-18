import { EventVisibility, TaskPriority, TaskStatus } from '@prisma/client';
import {
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  dueDate: string;

  @IsUUID()
  assignedToId: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  reminderDate?: string;

  @IsOptional()
  @IsUUID()
  relatedLeadId?: string;

  @IsOptional()
  @IsUUID()
  relatedCustomerId?: string;

  @IsOptional()
  @IsUUID()
  relatedMeetingId?: string;

  @IsOptional()
  @IsUUID()
  relatedQuotationId?: string;

  @IsOptional()
  @IsUUID()
  relatedDealId?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  checklist?: any[];

  @IsOptional()
  @IsArray()
  attachments?: any[];

  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility;
}
