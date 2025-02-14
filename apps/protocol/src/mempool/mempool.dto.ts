import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '@ph-blockchain/block';
import { AppHash } from '@ph-blockchain/hash';
import { Transform } from 'class-transformer';
import { IsNotEmpty, Length, Matches } from 'class-validator';

export class MempoolDto {
  @ApiProperty({
    description: 'Signed transaction to be added in the mempool',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @IsNotEmpty()
  @Matches(AppHash.HASH_REGEX, {
    each: true,
    message: 'Not a valid signed message',
  })
  @Length(Transaction.ENCODED_SIZE, Transaction.ENCODED_SIZE, {
    each: true,
    message: 'Transactions should be in 232 bytes',
  })
  transaction: string[];
}
