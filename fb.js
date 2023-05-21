const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const cheerio = require('cheerio');
const fs = require('fs');

chromium.use(stealth);

const FB_COOKIE = 'button[data-cookiebanner]:first-child';
const FB_USERNAME = '#email';
const FB_PASSWORD = '#pass';
const FB_LOGIN = 'button[name="login"]';

async function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function loginFB(fb, isCookie) {
  await fb.goto('https://facebook.com');
  await fb.waitForTimeout(1000);

  if (isCookie) {
    await fb.waitForSelector(FB_COOKIE, { delay: 500 });
    await fb.click(FB_COOKIE);
  }

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
  await fb.goto('https://mbasic.facebook.com/BH.Australia?v=timeline');
  await fb.waitForSelector('article');
}

async function processPosts(fb, dataFb) {
  let found = true;
  while (found) {
    try {
      const $ = cheerio.load(await fb.content());
      const section_selector = '#structured_composer_async_container > section';
      const section = $(section_selector);

      $(section).find('article').each(function () {
        let data = extractDataFromPost($(this));
        if (data && !dataExistsInArray(data, dataFb)) {
          dataFb.push(data);
        }
      });

      await fb.click('a[href*="profile/timeline/stream"]');
      await fb.waitForSelector('article');
      console.log(dataFb.length);
    } catch (error) {
      found = false;
    }
  }
  fs.writeFileSync('posts.json', JSON.stringify(dataFb, null, 2));
}

function extractDataFromPost(postElement) {
  let date = postElement.find('abbr').text().replace(/ at .*$/, '');
  date = date.replace(/(\w+) (\d+), (\d+)/, '$3-$1-$2');
  let dataFt = postElement.attr('data-ft');
  if (dataFt) {
    let dataJson = JSON.parse(dataFt.replace(/&quot;/g, '"'));
    if (dataJson) {
      let postId = dataJson.top_level_post_id;
      let pageId = dataJson.page_id;
      if (postId && pageId) {
        return {
          postId: postId,
          pageId: pageId,
          date: date,
        };
      }
    }
  }
  return null;
}

function dataExistsInArray(data, array) {
  return array.some(
    (item) => item.postId === data.postId && item.pageId === data.pageId
  );
}

async function extractAndSaveMonthlyData(dataFb, fb) {
  let monthlyData = {};
  for (let i = 0; i < dataFb.length; i++) {
    const metrics = await extractMetricsFromPost(fb, dataFb[i]);
    const yearMonth = formatYearMonth(dataFb[i].date);
    if (monthlyData[yearMonth]) {
      monthlyData[yearMonth].comments += metrics.comments;
      monthlyData[yearMonth].shares += metrics.shares;
      monthlyData[yearMonth].likes += metrics.likes;
      monthlyData[yearMonth].posts++;
    } else {
      monthlyData[yearMonth] = {
        comments: metrics.comments,
        shares: metrics.shares,
        likes: metrics.likes,
        posts: 1,
      };
    }
  }
  const final_data = convertMonthlyDataToArray(monthlyData);
  console.log(final_data);
  fs.writeFileSync('monthly_data.json', JSON.stringify(final_data, null, 2));
}

async function extractMetricsFromPost(fb, postData) {
  await fb.goto(
    'https://www.facebook.com/story.php?story_fbid=' +
      postData.postId +
      '&id=' +
      postData.pageId
  );
  await fb.waitForTimeout(1000);
  const $ = cheerio.load(await fb.content());
  await fb.goto(
    'https://mbasic.facebook.com/ufi/reaction/profile/browser/?ft_ent_identifier=' +
      postData.postId
  );
  let html = $.html();
  let commentCount = extractCountFromHtml(html, /(\d+)\scomments/);
  let shareCount = extractCountFromHtml(html, /(\d+)\sshares/);
  const likesCount = await extractLikesCount(fb);
  return { comments: commentCount, shares: shareCount, likes: likesCount };
}

function extractCountFromHtml(html, regex) {
  let match = html.match(regex);
  return match ? parseInt(match[1]) : 0;
}

async function extractLikesCount(fb) {
  const likesElement = await fb.$(
    '#root > table > tbody > tr > td > div > div > a:nth-child(5) > span'
  );
  return likesElement
    ? parseInt(await fb.evaluate((el) => el.innerText, likesElement))
    : 0;
}

function formatYearMonth(dateString) {
  let date = new Date(dateString);
  return (
    date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2)
  );
}

function convertMonthlyDataToArray(monthlyData) {
  return Object.entries(monthlyData).map(([date, data]) => ({
    date,
    posts: data.posts,
    comments: data.comments,
    shares: data.shares,
    likes: data.likes,
  }));
}

chromium
  .launch({
    headless: false,
    proxy: {
      server: 'http://104.222.187.135:6259',
      username: 'dmproxy5387',
      password: 'dmproxy5387',
    },
  })
  .then(async (browser) => {
    let fb = await browser.newPage();
    await loginFB(fb,true);

    let dataFb = [];
    await processPosts(fb, dataFb);
    await browser.close();

    const browser2 = await chromium.launch({
      headless: false,
      proxy: {
        server: 'http://154.92.124.189:5217',
        username: 'dmproxy5387',
        password: 'dmproxy5387',
      },
    });

    fb = await browser2.newPage();
    await loginFB(fb);
    await extractAndSaveMonthlyData(dataFb, fb);
    await browser2.close();
  });
