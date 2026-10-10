import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordHasher } from '../domain/password-hasher';

@Injectable()
export class BcryptHasher implements PasswordHasher {
  hash(plain: string) {
    return bcrypt.hash(plain, 10);
  }
  compare(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}
