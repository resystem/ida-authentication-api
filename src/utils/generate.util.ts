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
