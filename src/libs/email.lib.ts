import * as AWS from 'aws-sdk';

AWS.config.region = 'us-west-2';
const ses = new AWS.SES();

/**
 *
 * @param to
 * @returns
 */
const getEmailParams = (to) => ({
  Destination: {
    ToAddresses: [to.email.address],
  },
  Message: {
    Body: {
      Html: {
        Charset: 'UTF-8',
        Data: `IDA-${to.email.confirmation_code} é o código de confirmação para sua conta no IDA.`,
      },
      Text: {
        Charset: 'UTF-8',
        Data: `IDA-${to.email.confirmation_code} é o código de confirmação para sua conta no IDA.`,
      },
    },
    Subject: {
      Charset: 'UTF-8',
      Data: 'Código de confirmação',
    },
  },
  Source: 'gabrielfurlan05@gmail.com',
});

/**
 *
 * @param to
 * @param webBaseUri
 * @returns
 */
export const send = (to) =>
  new Promise((resolve, reject) => {
    ses.sendEmail(getEmailParams(to), (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
