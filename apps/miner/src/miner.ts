import { HttpStatus } from '@nestjs/common';
import { Block, Minter, Transaction } from '@ph-blockchain/block';
import { Transform } from '@ph-blockchain/transformer';
import { io } from 'socket.io-client';

export class Miner {
  private socket = io('ws://localhost:3002');
  private currentMiningBlock: Block;
  private readonly address;

  constructor(address: string) {
    this.address = Transform.removePrefix(address, Transaction.prefix);
  }

  connect() {
    this.socket.on('connect', () => {
      console.log('CONNECTED');
      this.socket.emit('init-miner');
    });

    this.socket.on(
      'new-block-info',
      async (data: {
        isNewBlock: boolean;
        details: {
          transaction: string[];
          activeBlockHash: string;
          targetHash: string;
          currentHeight: number;
          mintNonce: number;
          currentSupply: number;
        };
      }) => {
        const { details, isNewBlock } = data;

        if (details.currentSupply >= Number(Minter.FIX_MINT)) {
          details.transaction.push(
            new Minter({
              to: this.address,
              version: 1,
              nonce: details.mintNonce,
            }).encode(),
          );
        }

        if (isNewBlock || !this.currentMiningBlock) {
          this.currentMiningBlock?.stopMining();
          this.currentMiningBlock = new Block(
            Block.version,
            details.currentHeight,
            details.transaction,
            details.targetHash,
            details.activeBlockHash,
          );
        }

        if (!this.currentMiningBlock?.isMined) {
          await this.currentMiningBlock.mine(true);
        }

        if (!this.currentMiningBlock.isMined) return;

        this.socket.emit('submit-block', {
          ...this.currentMiningBlock.toJson(),
          mintAddress: this.address,
        });
      },
    );

    this.socket.on('mine-success', (data: { hash: string; earned: string }) => {
      console.log();
      console.log('==================================================');
      console.log('MINING SUCCESSFUL');
      console.log(`MINED: ${data.hash}`);
      console.log(`REWARD: ${data.earned}`);
      console.log('==================================================');
      console.log();
    });

    this.socket.on('error', (e) => {
      if (e.statusCode === HttpStatus.BAD_REQUEST) {
        console.log(
          `\rSomething went wrong with your block. MESSAGE: ${e.data.message}`,
        );

        return;
      }

      console.log(`\r${e.data.message}`);
    });

    this.socket.connect();
  }
}
