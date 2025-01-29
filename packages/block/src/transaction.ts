import { AppHash, Crypto } from '@ph-blockchain/hash';
import { Transform } from '@ph-blockchain/transformer';
import { RawTransaction, TransactionSignature } from './types';

export class Transaction {
  static prefix = 'ph-';
  static readonly BYTES_STRING_SIZES = [16, 16, 16, 64, 40, 40, 128] as const;
  static readonly ENCODED_SIZE = Transaction.BYTES_STRING_SIZES.reduce(
    (accumulator, value) => accumulator + value,
    0,
  );

  public static readonly TX_CONVERSION_UNIT = BigInt(1_000_000_000);
  public static readonly FIXED_FEE = Transaction.TX_CONVERSION_UNIT;

  public readonly from: string;
  public readonly to: string;
  public readonly amount: bigint;
  public readonly nonce: bigint;
  public readonly version: bigint;
  public readonly timestamp: bigint | undefined;

  private _transactionId: string;

  public signature?: TransactionSignature;

  constructor(data: RawTransaction) {
    const { from, to, amount, nonce, version, signature, timestamp } = data;

    this.from = from;
    this.to = to;
    this.amount = BigInt(amount);
    this.nonce = BigInt(nonce);
    this.version = BigInt(version);
    this.signature = signature;
    this.timestamp = timestamp ? BigInt(timestamp) : undefined;
  }

  serialize() {
    return {
      transactionId: this.transactionId,
      from: this.from,
      to: this.to,
      amount: this.amount.toString(),
      nonce: this.nonce.toString(),
      version: this.version.toString(),
      signature: this.signature.signedMessage,
      fixedFee: Transaction.FIXED_FEE.toString(),
      timestamp: this.timestamp?.toString(),
    };
  }

  public get rawFromAddress() {
    return Transform.removePrefix(this.from, Transaction.prefix);
  }

  public get rawToAddress() {
    return Transform.removePrefix(this.to, Transaction.prefix);
  }

  static encode(transaction: Transaction) {
    const { from, to, amount, nonce, version, signature } = transaction;

    if (!signature?.publicKey || !signature?.signedMessage)
      throw new Error(
        'Public key and signed message is not added in the signature field',
      );

    const { publicKey, signedMessage } = signature;

    const encodedVersion = Crypto.encodeIntTo8BytesString(version);
    const encodedNonce = Crypto.encodeIntTo8BytesString(nonce);
    const encodedAmount = Crypto.encodeIntTo8BytesString(amount);
    const encodedPublicKey = Crypto.toHexString(publicKey);
    const fromAddress = Transform.removePrefix(from, this.prefix);
    const toAddress = Transform.removePrefix(to, this.prefix);

    const data = `${encodedVersion}${encodedNonce}${encodedAmount}${encodedPublicKey}${fromAddress}${toAddress}${signedMessage}`;

    return data;
  }

  static buildMessage(transaction: Transaction) {
    return `${transaction.from}${transaction.to}${transaction.amount}${transaction.nonce}${transaction.version}${transaction.transactionId}`;
  }

  static decode(encodedMessage: string, timestamp?: bigint | number | string) {
    if (encodedMessage.length !== Transaction.ENCODED_SIZE) {
      throw new Error('Not a transaction');
    }

    const [_, slices] = Transaction.BYTES_STRING_SIZES.reduce(
      (accumulator, value) => {
        const start = accumulator[0];
        const end = start + value;
        const slicedString = encodedMessage.slice(start, end);
        accumulator[0] = end;
        accumulator[1].push(slicedString);
        return accumulator;
      },
      [0, []] as [number, string[]],
    );

    const version = Crypto.decode8BytesStringtoBigInt(slices[0]).toString();
    const nonce = Crypto.decode8BytesStringtoBigInt(slices[1]).toString();
    const amount = Crypto.decode8BytesStringtoBigInt(slices[2]).toString();
    const publicKey = Crypto.fromHexStringToBuffer(slices[3]);
    const fromAddress = Transform.addPrefix(slices[4], this.prefix);
    const toAddress = Transform.addPrefix(slices[5], this.prefix);

    const signature = slices[6];

    const currentPublicKeyWalletAddress =
      Crypto.generateWalletAddress(publicKey);

    if (currentPublicKeyWalletAddress !== fromAddress)
      throw new Error('Transaction is from a different wallet address');

    const transaction = new Transaction({
      version,
      from: currentPublicKeyWalletAddress,
      to: toAddress,
      amount,
      nonce,
      signature: {
        publicKey: new Uint8Array(publicKey),
        signedMessage: signature,
      },
      timestamp,
    });

    const message = Transaction.buildMessage(transaction);

    if (
      !transaction.signature?.publicKey ||
      !transaction.signature?.signedMessage
    )
      throw new Error('Public key or signature is required');

    const isValidMessage = Crypto.isValid(
      transaction.signature?.publicKey,
      message,
      signature,
    );

    if (!isValidMessage)
      throw new Error('This is not a valid transaction encoded message');

    return transaction;
  }

  get transactionId() {
    if (!this._transactionId) {
      this._transactionId = AppHash.createSha256Hash(
        `${this.from}${this.to}${this.amount}${this.nonce}${this.version}`,
      );
    }
    return this._transactionId;
  }

  sign(privateKey: Uint8Array) {
    const keyPair = Crypto.getKeyPairs(privateKey);
    const message = Crypto.signMessage(
      privateKey,
      Transaction.buildMessage(this),
    );

    this.signature = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey,
      signedMessage: message,
    };

    return this;
  }

  encode() {
    return Transaction.encode(this);
  }
}
