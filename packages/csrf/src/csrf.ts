import { SignJWT, jwtVerify } from 'jose';

export class Csrf {
  private _encodedKey: Uint8Array<ArrayBufferLike>;
  constructor(key: string) {
    this._encodedKey = new TextEncoder().encode(key);
  }

  generateToken() {
    return new SignJWT({
      date: Date.now(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5min')
      .sign(this._encodedKey);
  }

  async isValidToken(token: string) {
    try {
      await jwtVerify(token, this._encodedKey, {
        algorithms: ['HS256'],
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
