import { ApiPropertyOptional } from '@nestjs/swagger';

import { AppHash } from '@ph-blockchain/hash';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { Transformer } from '../utils/transformer';

export class AccountTransactionSearchDto {
  @ApiPropertyOptional({
    description: 'Start row of the transaction',
  })
  @IsOptional()
  @Transform(Transformer.toNumber)
  @IsNumber()
  start?: number;

  @ApiPropertyOptional({
    description: 'End row of the transaction',
  })
  @IsOptional()
  @Transform(Transformer.toNumber)
  @IsNumber()
  end?: number;

  @ApiPropertyOptional({
    description: 'Total number of rows to return',
  })
  @IsOptional()
  @Transform(Transformer.toNumber)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Set to true if you want to retrieve from latest to oldest',
  })
  @IsOptional()
  @Transform(Transformer.toBoolean)
  @IsBoolean()
  reverse?: boolean;

  @ApiPropertyOptional({
    description: 'Search for sender',
  })
  @IsOptional()
  @Matches(AppHash.HASH_REGEX, {
    message: 'Not a valid from address',
  })
  @Length(40, 40, {
    message: 'From address should be in 20 bytes',
  })
  from?: string;

  @ApiPropertyOptional({
    description: 'Search for recipient',
  })
  @IsOptional()
  @Matches(AppHash.HASH_REGEX, {
    message: 'Not a valid to address',
  })
  @Length(40, 40, {
    message: 'To address should be in 20 bytes',
  })
  to?: string;
}
