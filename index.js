"use strict"
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 4001;

/*
// Kayak boat orange
const kayak = 'https://www.aliexpress.com/item/1005002984636876.html';

//  Kayak vest
const vest = 'https://www.aliexpress.com/item/1005003213860929.html';

// Waterproof phone protector plastic case bag
const waterproof = 'https://www.aliexpress.com/item/1005001878001337.html';
// Good images but no white background image plastic phone protector cage bag
const noImgWaterproof = 'https://www.aliexpress.com/item/1005002863338788.html';

// Swimming goggles
const goggles = 'https://www.aliexpress.com/item/32697077590.html';

// const url = 'https://www.aliexpress.com/item/1005003413518415.html';
// const url = 'https://www.aliexpress.com/item/1005003352859996.html';
*/
//
async function configureBrowser(url) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 820 });
  // page.waitForNavigation();
  await page.setDefaultNavigationTimeout(0); // Why? My computer is super slow!!

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });
  await page.click('#switcher-info');

  await page.click('.switcher-language .select-item');
  await page.waitForSelector('.switcher-language .switcher-currency-c ul');
  await page.click('.switcher-language .switcher-currency-c ul li a');
  await page.click('.switcher-currency .switcher-currency-c');
  await page.waitForSelector('.switcher-currency .switcher-currency-c ul');
  await page.click('.switcher-currency .switcher-currency-c ul li a');
  await page.click('.ui-button');

  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.evaluate(() => window.scrollBy(0, window.innerHeight));
  const obj = {
    browser,
    page
  }
  return obj;
};

async function productName(page) {

  const title = await page.evaluate(() => document.querySelector('h1').innerText);
  const ratingStars = await page.evaluate(() => document.querySelector('.overview-rating-average').innerText);
  const productReviews = await page.evaluate(() => document.querySelector('.product-reviewer-reviews').innerText);
  const totalSold = await page.evaluate(() => document.querySelector('.product-reviewer-sold').innerText);

  const obj = {
    title,
    ratingStars,
    productReviews,
    totalSold
  };
  return obj;
};

async function productBanner(page) {

  const imgArray = [];
  const video = await page.$$eval('.video-wrap video', (videos) => videos.map(x => x.src));
  const bannerImages = await page.$$('.images-view-list img');

  for (let image of bannerImages) {
    image.hover();

    const selector = '.magnifier-image';
    await page.waitForFunction(
      (selector) => !!document.querySelector(selector),
      {},
      selector
    );
    await page.waitForSelector(selector);

    const img = await page.evaluate(() => document.querySelector('.magnifier-image').src );
    imgArray.push(img)
  }
  const finalArray = imgArray.concat(video);
  return finalArray;
};

async function productSKU(page) {

  const skuPropertyList = await page.$$eval('.sku-property-list img', (imgs) => imgs.map(x => {
    x.click();
    let type = 1;
    let skuPrice;
    const skuImg = x.src;
    const productPrice = document.querySelector('.product-price-value');
    productPrice ? skuPrice = productPrice.innerText : skuPrice = document.querySelector('.uniform-banner-box-price').innerText;
    const skuTitle = document.querySelector('.sku-title-value').innerText;
    const totalQuantity = document.querySelector('.product-quantity-tip span').innerText;
    const quantity = totalQuantity.replace(/[^0-9]/g, '');
    const magnifiedImg = document.querySelector('.magnifier-image').src;
    const container = {
      type,
      skuPrice,
      skuTitle,
      quantity,
      skuImg,
      magnifiedImg
    };
    return container;
  }));
  skuPropertyList.map((x, i) => x.type = x.type + i);
  return skuPropertyList;
};

async function productDescription(page) {

  const photos = await page.$$eval('.origin-part img', (imgs) => imgs.map(x => x.src));
  let htmlArray = await page.evaluate(() => Array.from(document.querySelectorAll('.origin-part')).map(x => x.innerHTML));
  let textArray = await page.evaluate(() => Array.from(document.querySelectorAll('.origin-part')).map(x => x.innerText));
  const html = htmlArray.join('');
  const text = textArray.join('');

  const obj = {
    text,
    photos,
    html,
    textArray,
    htmlArray
  };

  return obj;
};

async function productReviews(page) {
  // to be continued...
};

async function monitor(url) {
  const config = await configureBrowser(url);
  const name = await productName(config.page);
  const banner = await productBanner(config.page);
  const sku = await productSKU(config.page);
  const desc = await productDescription(config.page);
  // const rev = await productReviews(config.page); // nothing atm cant be asked to fetch reviews might do in the future..
  // console.log(sku);
  const obj = {
    name,
    banner,
    sku,
    desc,
  };
  await config.browser.close();
  return obj;
};

// monitor()

app.get('/aliscraper/:uri', async (req, res) => {
  try {
    // monitor().then(ss => console.log(ss)).catch(err => console.log('fault' + err)); // scrapping complete!
    const url = 'https://www.aliexpress.com/item/' + req.params.uri + '.html';
    console.log(url);
    const scrape = await monitor(url); // scrapping complete!
    console.log(scrape);
    res.status(200).send(scrape);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/nothing', (req, res) => {
  res.send('Hello nothing');
});

app.listen(PORT, () => console.log(`Server is listening on port #${PORT}`));


/*
web: node index.js
heroku buildpacks:add heroku/nodejs -a puppy-ali-scrapper
heroku buildpacks:add jontewks/puppeteer -a puppy-ali-scrapper
heroku buildpacks:publish https://github.com/heroku/heroku-buildpack-google-chrome master
heroku buildpacks:publish https://github.com/heroku/heroku-buildpack-google-chrome -a puppy-ali-scrapper
heroku buildpacks:publish heroku/google-chrome master
heroku buildpacks:add https://github.com/jontewks/puppeteer-heroku-buildpack
heroku buildpacks:add https://github.com/jontewks/puppeteer-heroku-buildpack
heroku buildpacks:add heroku/
heroku buildpacks:add heroku/google-chrome
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-google-chrome.git -a puppy-ali-scrapper

*/