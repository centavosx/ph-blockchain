import { AppHash, Crypto } from '@ph-blockchain/hash';

export type KeyPairs = {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
};

export class Transaction {
  public readonly from: string;
  public readonly to: string;
  public readonly amount: string;
  public readonly nonce: string;
  public readonly version: string;

  public signature?: Partial<
    KeyPairs & {
      signedMessage: string;
    }
  >;

  constructor(
    data: Omit<
      Transaction,
      | 'hashedFrom'
      | 'hashedTo'
      | 'hashedAmount'
      | 'transactionId'
      | 'sign'
      | 'encode'
    >,
  ) {
    const { from, to, amount, nonce, version, signature } = data;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.nonce = nonce;
    this.version = version;
    this.signature = signature;
  }

  static readonly ENCODED_SIZE = 7;

  static encode(transaction: Transaction) {
    const { from, to, amount, nonce, version, signature } = transaction;

    if (!signature?.publicKey || !signature?.signedMessage)
      throw new Error(
        'Public key and signed message is not added in the signature field',
      );

    const { publicKey, signedMessage } = signature;

    return `${Crypto.toHexString(version)}-${Crypto.toHexString(publicKey)}-${Crypto.toHexString(from)}-${Crypto.toHexString(to)}-${Crypto.toHexString(amount)}-${Crypto.toHexString(nonce)}-${signedMessage}`;
  }

  static buildMessage(transaction: Transaction) {
    return `${transaction.from}${transaction.to}${transaction.amount}${transaction.nonce}${transaction.version}${transaction.transactionId}`;
  }

  static decode(encodedMessage: string) {
    const encodedHexes = encodedMessage.split('-');

    if (encodedHexes.length !== Transaction.ENCODED_SIZE) {
      throw new Error('Not a valid message');
    }

    const [version, publicKey, from, to, amount, nonce, signature] =
      encodedHexes.map((value) => Crypto.fromHexStringToRawString(value));

    const transaction = new Transaction({
      version,
      from,
      to,
      amount,
      nonce,
      signature: {
        publicKey: new Uint8Array(Crypto.fromHexStringToBuffer(publicKey)),
        signedMessage: signature,
      },
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

    if (!isValidMessage) throw new Error('This is not a valid encoded message');

    return transaction;
  }

  private get hashedFrom() {
    return AppHash.createSha256Hash(this.from);
  }

  private get hashedTo() {
    return AppHash.createSha256Hash(this.to);
  }

  private get hashedAmount() {
    return AppHash.createSha256Hash(this.amount);
  }

  private get transactionId() {
    return AppHash.createSha256Hash(
      `${this.hashedFrom}${this.hashedTo}${this.hashedAmount}${this.nonce}${this.version}`,
    );
  }

  sign(privateKey: Buffer) {
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
  }

  encode() {
    return Transaction.encode(this);
  }
}
