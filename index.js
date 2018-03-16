const request = require('request');
const cheerio = require('cheerio');
const process = require('process');
const moment = require('moment');
const Mailgun = require('mailgun-js');

const FRESK_URL = 'http://tourfresk.com/plans/';
const MAILGUN_API_KEY = process.env.API_KEY;
const MAILGUN_DOMAIN = process.env.DOMAIN;
const FROM = 'do.not.reply@fresk-data.com';
const TO = 'f_roseberry@live.fr';

const fetchAppartments = callback => {
  request(FRESK_URL, (error, response, html) => {
    if (error) {
      return;
    }

    const $ = cheerio.load(html);
    const appartments = [];
    const since = moment.utc();
    $('.noUnites').each(function () {
      const node = $(this);
      const nodes = node.find('h5');
      const isReserved = nodes.eq(0).text() == 'UNITÉ RÉSERVÉE';
      if (!isReserved) {
        const name = readName(nodes);
        const rent = readRent(nodes);
        appartments.push({ name, rent, since });
      }
    });

    callback(appartments);
  });
}

const readName = nodes => nodes.eq(0).children().eq(0).text();

const readRent = nodes => nodes.eq(3).children().eq(0).text();

const appartmentMessage = appartments => {
  let message = '<table><thead><td>Nom</td><td>Loyer</td></thead><tbody>';
  message += appartments.map(appartment => '<tr><td>' + appartment.name + '</td><td>' + appartment.rent + '</td></tr>').join('');
  message += '</tbody></table>'
  return message;
};

const sendEmail = appartments => {
  const mailgun = new Mailgun({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN });

  const data = {
    from: FROM,
    to: TO,
    subject: 'Appartements disponibles dans la tour Fresk',
    html: appartmentMessage(appartments)
  }

  mailgun.messages().send(data, (err, body) => {
      if (err) {
          console.log("got an error sending email:", err);
      } else {
          console.log('sent email');
          console.log(body);
      }
  });
};

fetchAppartments(appartments => {
  console.log(appartments);

  if (MAILGUN_API_KEY && MAILGUN_DOMAIN) {
    sendEmail(appartments);
  }
});
