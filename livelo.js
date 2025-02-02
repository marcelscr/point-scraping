import puppeteer from "puppeteer";

// Mocked User Agent
const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

// Partners to filter. Leave empty to get all partners.
const partners = [];

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
page.setUserAgent(ua);

// Navigate the page to a URL.
await page.goto("https://www.livelo.com.br/ganhe-pontos-compre-e-pontue", {
  waitUntil: "networkidle0",
});

// Set screen size.
await page.setViewport({ width: 1080, height: 1024 });

// Extract the required information
const data = await page.$$eval("#div-parity", (cards) =>
  cards.map((card) => {
    const image = card.querySelector(".parity__card--img"); // Get image element
    const currencyElement = card.querySelector(
      '[data-bind="text: $data.currency"]'
    ); // Get currency
    const valueElement = card.querySelector('[data-bind="text: $data.value"]'); // Get value
    const parityElement = card.querySelector(
      '[data-bind="text: $data.parity"]'
    ); // Get parity
    const clubParityElement = card.querySelector(
      '[data-bind="text: $data.extended_parity_clube"]'
    ); // Get club parity

    if (!clubParityElement) {
      return {
        partner: image ? image.alt.trim() : null,
        clubBonus: false,
        currency: valueElement ? currencyElement.textContent.trim() : null,
        value: valueElement ? valueElement.textContent.trim() : null,
        parity: parityElement ? parityElement.textContent.trim() : null,
      };
    }

    const parseClubParityString = (input) => {
      const regex = /^([A-Z$]+)\s*([\d,.]+)\s*até\s*([\d,.]+)/;
      // Input example: "U$ 1 até 3 pontos"
      const match = input.match(regex);

      if (match) {
        return {
          currency: match[1], // e.g., "U$"
          value: match[2], // e.g., "1"
          parity: match[3], // e.g., "3"
        };
      } else {
        return null;
      }
    };

    return {
      partner: image ? image.alt.trim() : null,
      clubBonus: true,
      ...parseClubParityString(clubParityElement.textContent.trim()),
    };
  })
);

if (partners.length > 0) {
  const filteredData = data.filter((item) =>
    partners.includes(item.partner.toLowerCase())
  );
  console.log(filteredData);
} else {
  console.log(data);
}

await browser.close();
