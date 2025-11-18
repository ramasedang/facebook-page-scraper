# Facebook Page Scraper

A Node.js web scraper built with Playwright that extracts posts and engagement metrics from Facebook pages.

## Features

- Automated Facebook login with stealth mode
- Extract posts from Facebook page timelines
- Collect engagement metrics (likes, comments, shares)
- Monthly data aggregation and analysis
- Proxy support for web scraping

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/facebook-page-scraper.git
   cd facebook-page-scraper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Update the Facebook credentials in `fb.js`:
   ```javascript
   await fb.type(FB_USERNAME, 'your-email@example.com');
   await fb.type(FB_PASSWORD, 'your-password');
   ```

2. Configure proxy settings (optional):
   ```javascript
   proxy: {
     server: 'http://your-proxy-server:port',
     username: 'your-proxy-username',
     password: 'your-proxy-password',
   }
   ```

3. Update the target Facebook page URL:
   ```javascript
   await fb.goto('https://mbasic.facebook.com/PAGE_NAME?v=timeline');
   ```

4. Run the scraper:
   ```bash
   node fb.js
   ```

## Output

The scraper generates two JSON files:

- `posts.json`: Contains individual post data with IDs and dates
- `monthly_data.json`: Contains aggregated monthly metrics

## Project Structure

```
facebook-page-scraper/
├── fb.js              # Main scraper script
├── package.json       # Project dependencies
└── .gitignore         # Git ignore file
```

## Dependencies

- **playwright-extra**: Enhanced Playwright with plugin support
- **puppeteer-extra-plugin-stealth**: Stealth plugin for avoiding detection
- **cheerio**: Server-side jQuery for HTML parsing
- **fs**: Node.js file system module

## Legal Notice

This tool is for educational purposes only. Users are responsible for complying with Facebook's Terms of Service and applicable laws. The author is not responsible for misuse of this software.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.