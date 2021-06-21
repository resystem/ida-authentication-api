const POSSIBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * generate a random key based on number passed
 * @param {number} length max number of characters
 * @returns {string} random key
 */
export const generateKey = (length = 32) => {
  let text = '';

  for (let i = 0; i < length; i += 1) {
    text += POSSIBLE_CHARS.charAt(
      Math.floor(Math.random() * POSSIBLE_CHARS.length),
    );
  }

  return text;
};

/**
 * function that generate phone validation code and save phone in the user
 * @returns {string} random string to phone validation
 */
export const generateRandomCode = () => {
  const codeSize = 4;
  const fisrtPossibleChars = '123456789';
  const possibleChars = '0123456789';
  let text = '';
  for (let i = 0; i < codeSize; i += 1) {
    if (i === 0) {
      text += fisrtPossibleChars.charAt(
        Math.floor(Math.random() * fisrtPossibleChars.length),
      );
    } else {
      text += possibleChars.charAt(
        Math.floor(Math.random() * possibleChars.length),
      );
    }
  }
  return text;
};
