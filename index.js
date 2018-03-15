const request = require('request');
const cheerio = require('cheerio');

request('http://tourfresk.com/plans/', (error, response, html) => {
  if (error) {
    return;
  }

  const $ = cheerio.load(html);
  $('.noUnites').each(function () {
    const node = $(this);
    const nodes = node.find('h5');
    const name = nodes.eq(0).children().eq(0).text();
    console.log('Appartment node found', name);
  });
});
