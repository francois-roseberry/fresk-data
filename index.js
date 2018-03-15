const request = require('request');
const cheerio = require('cheerio');

request('http://tourfresk.com/plans/', (error, response, html) => {
  if (error) {
    return;
  }

  const $ = cheerio.load(html);
  const appartments = [];
  $('.noUnites').each(function () {
    const node = $(this);
    const nodes = node.find('h5');
    const isReserved = nodes.eq(0).text() == 'UNITÉ RÉSERVÉE';
    if (!isReserved) {
      const name = readName(nodes);
      const rent = readRent(nodes);
      appartments.push({ name, rent });
    }
  });

  console.log(appartments);
});

const readName = nodes => nodes.eq(0).children().eq(0).text();

const readRent = nodes => {
  const monthlyRentString = nodes.eq(3).children().eq(0).text();
  rentString = monthlyRentString.split('\$')[0].trim().replace(/\s/g, '');
  return parseInt(rentString);
}
