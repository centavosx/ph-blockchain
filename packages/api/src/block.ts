import { MintOrTxSerialize, RawBlock } from '@ph-blockchain/block';
import { BaseApi } from './base';
import {
  BlockHealthResult,
  BlockHeightQuery,
  BlockTransactionQuery,
  BlockTransactionResult,
} from './types/block';
import { PaginationData } from './types/pagination';

export class Block extends BaseApi {
  private static baseEndpoint = '/block';

  static getBlocks(params: BlockHeightQuery) {
    return super.get<BlockHeightQuery, PaginationData<RawBlock>>(
      this.baseEndpoint,
      params,
    );
  }

  static getBlockByHeight(height: string | number) {
    return super.get<unknown, RawBlock>(
      `${Block.baseEndpoint}/height/${height}`,
    );
  }

  static getBlockByHash(hash: string) {
    return super.get<unknown, RawBlock>(`${this.baseEndpoint}/hash/${hash}`);
  }

  static getHealth() {
    return super.get<unknown, BlockHealthResult>(`${this.baseEndpoint}/health`);
  }

  static getTransactions(params: BlockTransactionQuery) {
    return super.get<BlockTransactionQuery, BlockTransactionResult>(
      `${Block.baseEndpoint}/transaction`,
      params,
    );
  }

  static getTransactionById(id: string) {
    return super.get<unknown, MintOrTxSerialize>(
      `${Block.baseEndpoint}/transaction/${id}`,
    );
  }
}
