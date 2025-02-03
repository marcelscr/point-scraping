import puppeteer from "puppeteer";

// Mocked User Agent
const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";
const url = "https://www.livelo.com.br/ganhe-pontos-compre-e-pontue";
// Partners to filter. Leave empty to get all partners.
const partners = ["amazon", "asics", "centauro", "farmacias app", "netshoes"];

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({ headless: true });

// Open a new blank page and navigate to the Livelo URL
const page = await browser.newPage();
page.setUserAgent(ua);

console.log(`Opening ${url}...`);

await page.goto(url, {
  waitUntil: "networkidle0",
});

// Set screen size.
await page.setViewport({ width: 1080, height: 1024 });

if (partners.length > 0) {
  console.log(`Searching for partners: ${partners.join(", ")} in Livelo...`);
} else {
  console.log("Searching all partners  in Livelo...");
}

// Extract the required information
const data = await page.$$eval("#div-parity", (cards) =>
  cards.map((card) => {
    const image = card.querySelector(".parity__card--img");
    const currencyElement = card.querySelector(
      '[data-bind="text: $data.currency"]'
    );
    const valueElement = card.querySelector('[data-bind="text: $data.value"]');
    const parityElement = card.querySelector(
      '[data-bind="text: $data.parity"]'
    );
    // Check if the card has a club bunus, which changes the structure of the card
    const clubParityElement = card.querySelector(
      '[data-bind="text: $data.extended_parity_clube"]'
    );

    if (!clubParityElement) {
      return {
        program: "Livelo",
        partner: image ? image.alt.trim() : null,
        currency: currencyElement ? currencyElement.textContent.trim() : null,
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
      program: "Livelo",
      partner: image ? image.alt.trim() : null,
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
