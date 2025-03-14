import { HttpStatus } from '@nestjs/common';
import { Events } from '@ph-blockchain/api';
import { Block, Minter, Transaction } from '@ph-blockchain/block';
import { Transform } from '@ph-blockchain/transformer';

export class Miner {
  private currentMiningBlock: Block;
  private readonly address;

  constructor(address: string) {
    this.address = Transform.removePrefix(address, Transaction.prefix);
  }

  connect() {
    Events.connect('ws://localhost:3002');

    Events.createConnectionListener(() => {
      console.log('CONNECTED');
      Events.initMiner();
    });

    Events.createNewBlockInfoListener(async (data) => {
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

      Events.submitBlock({
        ...this.currentMiningBlock.toJson(),
        mintAddress: this.address,
      });
    });

    Events.createMineSuccessfulListener((data) => {
      console.log();
      console.log('==================================================');
      console.log('MINING SUCCESSFUL');
      console.log(`MINED: ${data.hash}`);
      console.log(`REWARD: ${data.earned}`);
      console.log('==================================================');
      console.log();
    });

    Events.createErrorListener((e) => {
      if (e.statusCode === HttpStatus.BAD_REQUEST) {
        console.log(
          `\rSomething went wrong with your block. MESSAGE: ${e.data.message}`,
        );

        return;
      }

      console.log(`\r${e.data.message}`);
    });
  }
}
