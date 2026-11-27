import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import path from 'node:path';
import { Builder, By, Select, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const extensionPath = path.resolve(process.cwd(), '.output/firefox-mv3');
const FAVICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function fixturePage(title) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <link rel="icon" type="image/png" href="${FAVICON}"></head>
  <body><h1>${title}</h1><p>Local fixture for the Stow Firefox smoke suite.</p></body></html>`;
}

async function startFixtures() {
  const server = createServer((request, response) => {
    const name = (request.url ?? '/').replace(/^\//, '') || 'one';
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(fixturePage(`Fixture ${name}`));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('fixture server failed');
  return {
    server,
    base: `http://127.0.0.1:${address.port}`,
  };
}

async function waitForExtensionTab(driver) {
  let origin = null;
  await driver.wait(async () => {
    for (const handle of await driver.getAllWindowHandles()) {
      await driver.switchTo().window(handle);
      const url = await driver.getCurrentUrl();
      if (url.startsWith('moz-extension://')) {
        // Node reports `null` as the origin of an unknown scheme.
        const parsed = new URL(url);
        origin = `${parsed.protocol}//${parsed.host}`;
        return true;
      }
    }
    return false;
  }, 20_000, 'extension did not open a page after install');
  assert.ok(origin, 'no moz-extension origin found');
  await driver.wait(async () => {
    const counts = await driver.findElements(By.css('.rail'));
    return counts.length === 1;
  }, 10_000, 'library shell did not render');
  return origin;
}

async function count(driver, css) {
  return (await driver.findElements(By.css(css))).length;
}

async function waitForCount(driver, css, expected, message) {
  await driver.wait(async () => (await count(driver, css)) === expected, 15_000, message);
}

async function main() {
  const { server, base } = await startFixtures();
  const options = new firefox.Options();
  options.enableBidi();
  options.addArguments('-headless', '--width=1280', '--height=900');
  options.setPreference('browser.shell.checkDefaultBrowser', false);
  options.setPreference('browser.startup.homepage_override.mstone', 'ignore');

  // Firefox marks moz-extension pages as privileged; without this the classic
  // WebDriver commands (and BiDi script.evaluate) are refused.
  const service = new firefox.ServiceBuilder().setEnvironment({
    ...process.env,
    MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1',
  });
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build();

  /** @type {{ text: string, trace: string }[]} */
  const errorEntries = [];
  let origin = null;

  try {
    const bidi = await driver.getBidi();
    await bidi.subscribe('log.entryAdded');
    const socket = await bidi.socket;
    socket.on('message', (raw) => {
      let event;
      try {
        event = JSON.parse(Buffer.from(raw).toString());
      } catch {
        return;
      }
      if (event.method !== 'log.entryAdded' || event.params?.level !== 'error') return;
      errorEntries.push({
        text: event.params.text ?? '',
        trace: JSON.stringify(event.params.stackTrace ?? ''),
      });
    });

    await driver.get('about:blank');
    await driver.installWebExtension(extensionPath, { permanent: false });
    origin = await waitForExtensionTab(driver);

    // The install lands on the welcome route. Open three fixture tabs, then stow
    // the window from the library so the activity is user-driven, not injected.
    for (const name of ['one', 'two', 'three']) {
      await driver.switchTo().newWindow('tab');
      await driver.get(`${base}/${name}`);
    }

    const handles = await driver.getAllWindowHandles();
    let libraryHandle = null;
    for (const handle of handles) {
      await driver.switchTo().window(handle);
      const current = await driver.getCurrentUrl();
      if (current.startsWith(origin)) {
        libraryHandle = handle;
        break;
      }
    }
    assert.ok(libraryHandle, 'library tab disappeared');
    await driver.switchTo().window(libraryHandle);
    await driver.get(`${origin}/library.html#/`);

    await driver.findElement(By.xpath("//button[contains(., 'Stow this window')]")).click();
    await waitForCount(driver, '.tab-row', 3, 'stowed rows did not render');
    assert.equal(await count(driver, '.stack-head'), 1, 'expected a single stack');

    const storedIcons = await count(driver, 'img.favicon');
    const letterTiles = await count(driver, '.favicon-letter');
    console.log(`icons: stored=${storedIcons} letter=${letterTiles}`);
    assert.equal(storedIcons + letterTiles, 3, 'every row needs an icon or letter tile');
    if (storedIcons > 0) {
      const sources = await driver.findElements(By.css('img.favicon'));
      for (const image of sources) {
        assert.match(await image.getAttribute('src'), /^data:image\//);
      }
    }
    assert.ok(
      !(await driver.getPageSource()).includes('_favicon'),
      'Firefox must never request the Chromium-only _favicon endpoint',
    );

    await driver.findElement(By.xpath("//button[contains(., 'Restore all')]")).click();
    await waitForCount(driver, '.stack-head', 0, 'restore did not clear the stack');
    await driver.wait(
      async () => (await driver.getAllWindowHandles()).length >= 4,
      15_000,
      'restored tabs did not open',
    );

    await driver.switchTo().window(libraryHandle);
    await driver.get(`${origin}/library.html#/settings`);
    await new Select(await driver.findElement(By.css('#theme'))).selectByValue('dark');
    await new Select(await driver.findElement(By.css('#density'))).selectByValue('compact');
    await driver.wait(
      async () =>
        (await driver.executeScript(
          "return document.documentElement.dataset.theme + ':' + document.documentElement.dataset.density",
        )) === 'dark:compact',
      10_000,
      'appearance settings did not apply',
    );
    await driver.navigate().refresh();
    await driver.wait(
      async () =>
        (await driver.executeScript(
          "return document.documentElement.dataset.theme + ':' + document.documentElement.dataset.density",
        )) === 'dark:compact',
      10_000,
      'appearance settings did not survive a reload',
    );

    const extensionErrors = errorEntries
      .filter((entry) => entry.text.includes(origin) || entry.trace.includes(origin))
      .map((entry) => entry.text);
    assert.deepEqual(extensionErrors, [], `extension console errors: ${extensionErrors.join(' | ')}`);
    console.log('Firefox smoke suite passed: install, stow, icons, restore, settings, console clean.');
  } finally {
    await driver.quit();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
