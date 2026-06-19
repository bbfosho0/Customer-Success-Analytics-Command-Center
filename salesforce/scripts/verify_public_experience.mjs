import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE_URL = process.env.EXPERIENCE_BASE_URL || 'https://notapplicable-22b-dev-ed.develop.my.site.com/csccportfolio/';

const PAGES = [
    { id: 'command-center', nav: 'Command Center', heading: 'Executive Overview' },
    { id: 'at-risk-drilldown', nav: 'At-Risk Drilldown', heading: 'At-Risk Drilldown' },
    { id: 'expansion-pipeline', nav: 'Expansion Pipeline', heading: 'Expansion Pipeline' },
    { id: 'retention-cohorts', nav: 'Retention Cohorts', heading: 'Retention Cohorts' }
];

function urlFor(pageId) {
    const url = new URL(BASE_URL);
    url.searchParams.set('page', pageId);
    return url.toString();
}

async function expectDashboard(page, pageSpec) {
    await page.waitForURL((url) => url.searchParams.get('page') === pageSpec.id, { timeout: 15000 });
    await page.getByRole('heading', { name: pageSpec.heading, exact: true }).waitFor({ timeout: 15000 });
    await page.getByRole('link', { name: pageSpec.nav, exact: true }).waitFor({ timeout: 10000 });
    const active = await page.getByRole('link', { name: pageSpec.nav, exact: true }).getAttribute('aria-current');
    assert.equal(active, 'page', `${pageSpec.nav} should be marked active.`);
}

async function expectNoHorizontalOverflow(page) {
    const overflow = await page.evaluate(() => {
        const documentElement = document.documentElement;
        return documentElement.scrollWidth - documentElement.clientWidth;
    });
    assert.ok(overflow <= 2, `Expected no horizontal overflow, found ${overflow}px.`);
}

async function run() {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

    try {
        await page.goto(urlFor('command-center'), { waitUntil: 'domcontentloaded' });
        await expectDashboard(page, PAGES[0]);
        await assert.rejects(
            page.getByText('App Drilldowns', { exact: true }).waitFor({ timeout: 1000 }),
            undefined,
            'Command center should not render the old duplicate App Drilldowns panel.'
        );

        for (const pageSpec of PAGES.slice(1)) {
            await page.getByRole('link', { name: pageSpec.nav, exact: true }).click();
            await expectDashboard(page, pageSpec);
        }

        await page.goBack();
        await expectDashboard(page, PAGES[2]);
        await page.goForward();
        await expectDashboard(page, PAGES[3]);

        const mobile = await browser.newPage({ viewport: { width: 412, height: 915 }, isMobile: true });
        for (const pageSpec of PAGES) {
            await mobile.goto(urlFor(pageSpec.id), { waitUntil: 'domcontentloaded' });
            await expectDashboard(mobile, pageSpec);
            await expectNoHorizontalOverflow(mobile);
        }
        await mobile.close();
    } finally {
        await browser.close();
    }
}

run()
    .then(() => {
        console.log('Public Experience verification passed.');
    })
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
