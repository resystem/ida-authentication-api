import { hash as bHash } from 'bcrypt';

/**
 * crypt password to save on database
 * @param password password to be crypt
 * @returns crypted password
 */
export const hash = async (password: string): Promise<string> => {
  const saltRounds = 10;

  return await new Promise((resolve, reject) => {
    bHash(password, saltRounds, (err, hash) => {
      if (err) reject(err);
      resolve(hash);
    });
  });
};
