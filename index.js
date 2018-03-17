const request = require('request');
const cheerio = require('cheerio');
const process = require('process');
const moment = require('moment-timezone');
const Mailgun = require('mailgun-js');

const FRESK_URL = 'http://tourfresk.com/plans/';
const MAILGUN_API_KEY = process.env.API_KEY;
const MAILGUN_DOMAIN = process.env.DOMAIN;
const FROM = 'do.not.reply@fresk-data.com';
const TO = process.env.TO;

const fetchAppartments = callback => {
  request(FRESK_URL, (error, response, html) => {
    if (error) {
      return;
    }

    const $ = cheerio.load(html);
    const appartments = [];
    const timeString = moment().tz('America/Toronto').format('DD MMMM YYYY, h:mm');
    $('.noUnites').each(function () {
      const node = $(this);
      const nodes = node.find('h5');
      const isReserved = nodes.eq(0).text() == 'UNITÉ RÉSERVÉE';
      if (!isReserved) {
        const name = readName(nodes);
        const rentString = readRentString(nodes);
        const rent = toRent(rentString);
        appartments.push({ name, rentString, rent });
      }
    });

    appartments.sort(sortByRent);
    callback(timeString, appartments);
  });
}

const readName = nodes => nodes.eq(0).children().eq(0).text();

const readRentString = nodes => nodes.eq(3).children().eq(0).text();

const toRent = rentString => parseInt(rentString.split('\$')[0].trim().replace(/\s/g, ''));

const sortByRent = (a, b) => a.rent - b.rent;

const appartmentMessage = (timeString, appartments) => {
  let message = timeString + '<br/><br/><table><thead><td>Nom</td><td>Loyer</td></thead><tbody>';
  message += appartments.map(appartment => '<tr><td>' + appartment.name + '</td><td>' + appartment.rentString + '</td></tr>').join('');
  message += '</tbody></table>'
  return message;
};

const sendEmail = (timeString, appartments) => {
  const mailgun = new Mailgun({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN });

  const data = {
    from: FROM,
    to: TO,
    subject: 'Appartements disponibles dans la tour Fresk',
    html: appartmentMessage(timeString, appartments)
  }

  mailgun.messages().send(data, (err, body) => {
      if (err) {
          console.log("got an error sending email:", err);
      } else {
          console.log('sent email to', TO);
          console.log(body);
      }
  });
};

fetchAppartments((timeString, appartments) => {
  console.log('Fetched at :', timeString);
  console.log(appartments);

  if (MAILGUN_API_KEY && MAILGUN_DOMAIN && TO) {
    sendEmail(timeString, appartments);
  } else {
    console.log('did not send email because either no mailgun credentials or destination addresses were specified');
  }
});
