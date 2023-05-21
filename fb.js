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

async function loginFB(fb) {
  await fb.goto('https://facebook.com');
  await fb.waitForTimeout(1000);
  await fb.waitForSelector(FB_COOKIE, { delay: 500 });
  await fb.click(FB_COOKIE);
  await fb.waitForSelector(FB_USERNAME, { delay: 500 });
  await fb.waitForTimeout(100);
  await fb.focus(FB_USERNAME);
  await fb.type(FB_USERNAME, 'akunbaru080401@gmail.com', {
    delay: 20,
  });
  await fb.waitForSelector(FB_PASSWORD, { delay: 300 });
  await fb.waitForTimeout(500);
  await fb.focus(FB_PASSWORD);
  await fb.type(FB_PASSWORD, 'katasandi123!', { delay: 20 });
  await fb.waitForTimeout(500);
  await fb.click(FB_LOGIN);
  await fb.waitForTimeout(5000);
  await fb.goto(
    'https://mbasic.facebook.com/BH.Australia?v=timeline'
  );
  await fb.waitForSelector('article');
}

const FB_COOKIE = 'button[data-cookiebanner]:first-child';
const FB_USERNAME = '#email';
const FB_PASSWORD = '#pass';
const FB_LOGIN = 'button[name="login"]';

let total_post = 0;
let total_comment = 0;
let total_share = 0;
let final_data = [];

chromium
  .launch({
    headless: false,
    proxy: {
      server: 'http://104.222.187.135:6259', // your SOCKS5 proxy server
      username: 'dmproxy5387', // your username
      password: 'dmproxy5387', // your password
    },
  })
  .then(async (browser) => {
    let fb = await browser.newPage();
    await loginFB(fb);

    let dataFb = [];

    let found = true;
    while (found) {
      try {
        const $ = cheerio.load(await fb.content());
        const section_selector =
          '#structured_composer_async_container > section';
        const section = $(section_selector);
        $(section)
          .find('article')
          .each(function () {
            let date = $(this)
              .find('abbr')
              .text()
              .replace(/ at .*$/, '');
            //November 28, 2017 converted to 2017-11-28
            date = date.replace(/(\w+) (\d+), (\d+)/, '$3-$1-$2');
            // console.log(date);
            let dataFt = $(this).attr('data-ft');
            if (dataFt) {
              let dataJson = JSON.parse(
                dataFt.replace(/&quot;/g, '"')
              );
              if (dataJson) {
                let postId = dataJson.top_level_post_id;
                let pageId = dataJson.page_id;
                if (
                  postId &&
                  pageId &&
                  !dataFb.some(
                    (item) =>
                      item.postId === postId && item.pageId === pageId
                  )
                ) {
                  dataFb.push({
                    postId: postId,
                    pageId: pageId,
                    date: date,
                  });
                }
              }
            }
          });
        // Click the next button
        await fb.click('a[href*="profile/timeline/stream"]');
        // Wait for <article> tag
        await fb.waitForSelector('article');
        console.log(dataFb.length);
      } catch (error) {
        found = false;
      }
    }

    console.log(dataFb);
    fs.writeFileSync('posts.json', JSON.stringify(dataFb, null, 2));
    await browser.close();

    // let dataFb = JSON.parse(fs.readFileSync('posts.json'));

    let monthlyData = {};

    const browser2 = await chromium.launch({
      headless: false,
      proxy: {
        server: 'http://154.92.124.189:5217', // your SOCKS5 proxy server
        username: 'dmproxy5387', // your username
        password: 'dmproxy5387', // your password
      },
    });

    fb = await browser2.newPage();
    await loginFB(fb);

    for (let i = 0; i < dataFb.length; i++) {
      await fb.goto(
        'https://www.facebook.com/story.php?story_fbid=' +
          dataFb[i].postId +
          '&id=' +
          dataFb[i].pageId
      );
      await fb.waitForTimeout(1000);
      const $ = cheerio.load(await fb.content());
      await fb.goto(
        'https://mbasic.facebook.com/ufi/reaction/profile/browser/?ft_ent_identifier=' +
          dataFb[i].postId
      );
      let html = $.html();
      let commentMatch = html.match(/(\d+)\scomments/);
      let shareMatch = html.match(/(\d+)\sshares/);

      let commentCount = commentMatch ? parseInt(commentMatch[1]) : 0;
      let shareCount = shareMatch ? parseInt(shareMatch[1]) : 0;

      let date = new Date(dataFb[i].date);
      let yearMonth =
        date.getFullYear() +
        '-' +
        ('0' + (date.getMonth() + 1)).slice(-2); // format as YYYY-MM

      const likesElement = await fb.$(
        '#root > table > tbody > tr > td > div > div > a:nth-child(5) > span'
      );
      const likesCount = likesElement
        ? parseInt(
            await fb.evaluate((el) => el.innerText, likesElement)
          )
        : 0;

      if (monthlyData[yearMonth]) {
        monthlyData[yearMonth].comments += commentCount;
        monthlyData[yearMonth].shares += shareCount;
        monthlyData[yearMonth].likes += likesCount;
        monthlyData[yearMonth].posts++;
      } else {
        monthlyData[yearMonth] = {
          comments: commentCount,
          shares: shareCount,
          likes: likesCount,
          posts: 1,
        };
      }
    }

    // Convert the monthly data into an array
    let final_data = Object.entries(monthlyData).map(
      ([date, data]) => ({
        date,
        posts: data.posts,
        comments: data.comments,
        shares: data.shares,
        likes: data.likes,
      })
    );

    console.log(final_data);
    fs.writeFileSync(
      'monthly_data.json',
      JSON.stringify(final_data, null, 2)
    );

    await browser.close();
  });
