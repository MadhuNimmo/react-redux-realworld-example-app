const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--shm-size=3gb',
      '--single-process',
    ],
  });
  const page = await browser.newPage();

  await Promise.all([page.coverage.startJSCoverage()]);

  await Promise.race([
    page.goto('http://192.168.1.220:3000/', {
      waitUntil: ['load', 'networkidle2'],
    }),
    page.waitForSelector('body'),
  ]);

  await page.waitFor(5000);

  const jsCoverage = await Promise.all([page.coverage.stopJSCoverage()]);
  const js_coverage = [...jsCoverage];
  //Parse collected JS Coverage
  let cov = {};
  cnt = 0;
  for (const entry of js_coverage[0]) {
    if (!(entry.url in cov)) {
      cov[entry.url] = {
        js_total_bytes: 0,
        js_used_bytes: 0,
      };
    }
    cov[entry.url]['js_total_bytes'] =
      cov[entry.url]['js_total_bytes'] + entry.text.length;

    for (const range of entry.ranges) {
      cov[entry.url]['js_used_bytes'] =
        cov[entry.url]['js_used_bytes'] + range.end - range.start;
    }
  }
  for (entry in cov) {
    console.log(
      `Utilization percetages ${entry}: ${
        (cov[entry]['js_used_bytes'] / cov[entry]['js_total_bytes']) * 100
      }%`
    );
  }
  await browser.close();
})();

/* Follow the below instructions to make this script work: 
npm install -g serve
npm run build
serve -s build
open the project in another terminal
node pupScript.js <it crashes at times. just wait for a few seconds and launch again. its a bit memory intensive too>
*/
