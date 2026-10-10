import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty,
  IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({ example: 'https://example.com/some/very/long/path' })
  @IsString() @IsNotEmpty() @MaxLength(2048)
  url: string;

  @ApiPropertyOptional({ example: 'my-portfolio' })
  @IsOptional() @IsString() @Matches(/^[A-Za-z0-9_-]{3,32}$/, { message: 'Alias must be 3-32 chars: letters, numbers, - or _' })
  alias?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(1_000_000_000)
  maxClicks?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(4) @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  tags?: string[];
}

/** For PATCH, `null` clears a value (e.g. expiresAt: null removes the expiry). */
export class UpdateLinkDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2048)
  url?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
  maxClicks?: number | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(4) @MaxLength(72)
  password?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  tags?: string[];
}

export class BulkCreateDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @IsString({ each: true })
  urls: string[];
}

export class BulkDeleteDto {
  @ApiProperty({ type: [Number] }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @IsInt({ each: true })
  ids: number[];
}

export class ListLinksQueryDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsString() @MaxLength(30) tag?: string;
  @IsOptional() @IsIn(['active', 'disabled', 'expired']) status?: 'active' | 'disabled' | 'expired';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize: number = 10;
}

export class UnlockDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(72)
  password: string;
}
