import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PageOptionsDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  pageSize?: number = 10;

  @ApiPropertyOptional()
  @Type(() => String)
  @IsString()
  @IsOptional()
  title?: string = '';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  order?: string = 'ASC';

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.pageSize ?? 10);
  }
}
