const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const cheerio = require('cheerio');
const fs = require('fs');

chromium.use(stealth);

async function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

const FB_COOKIE = 'button[data-cookiebanner]:first-child';
const FB_USERNAME = '#email';
const FB_PASSWORD = '#pass';
const FB_LOGIN = 'button[name="login"]';

let total_post = 0;
let total_comment = 0;

chromium
  .launch({
    headless: true,
    proxy: {
      server: 'http://104.222.187.135:6259', // your SOCKS5 proxy server
      username: 'dmproxy5387', // your username
      password: 'dmproxy5387', // your password
    },
  })
  .then(async (browser) => {
    const fb = await browser.newPage();
    await fb.goto('https://facebook.com');
    await fb.waitForTimeout(1000);
    await fb.waitForSelector(FB_COOKIE, { delay: 500 });
    await fb.click(FB_COOKIE);
    await fb.waitForSelector(FB_USERNAME, { delay: 500 });
    await fb.waitForTimeout(500);
    await fb.focus(FB_USERNAME);
    await fb.type(FB_USERNAME, 'akunbaru080401@gmail.com', {
      delay: 15,
    });
    await fb.waitForSelector(FB_PASSWORD, { delay: 500 });
    await fb.waitForTimeout(500);
    await fb.focus(FB_PASSWORD);
    await fb.type(FB_PASSWORD, 'katasandi123!', { delay: 15 });
    await fb.waitForTimeout(500);
    await fb.click(FB_LOGIN);
    await fb.waitForTimeout(5000);
    await fb.goto(
      'https://mbasic.facebook.com/BH.Australia?v=timeline'
    );
    await fb.waitForSelector('article');

    let found = true;
    while (found) {
      try {
        const content = await fb.content();
        const $ = cheerio.load(content);
        const commentElements = $('a:contains("Comment")');

        // Iterate over commentElements
        commentElements.each((i, el) => {
          const text = $(el).text();
          const numComments = Number(text.split(' ')[0]);
          total_comment += isNaN(numComments) ? 0 : numComments;
        });

        const articlesCount = $('article').length;
        total_post += articlesCount;

        // Click the next button
        await fb.click('a[href*="profile/timeline/stream"]');
        // Wait for <article> tag
        await fb.waitForSelector('article');
        console.log('Total posts: ' + total_post);
        console.log('Total comments: ' + total_comment);
        console.log('----------------------');
      } catch (error) {
        found = false;
      }
    }

    await browser.close();
  });
