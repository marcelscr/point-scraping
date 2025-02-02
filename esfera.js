import puppeteer from "puppeteer";

// Mocked User Agent
const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

// Partners to filter. Leave empty to get all partners.
const partners = ["amazon", "asics", "centauro", "farmacias app", "netshoes"];

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({ headless: true });

// Open a new blank page and navigate to the Esfera URL
const page = await browser.newPage();
page.setUserAgent(ua);
await page.goto(
  "https://www.esfera.com.vc/c/junte-pontos/junte-pontos/esf02163",
  {
    waitUntil: "networkidle0",
  }
);

// Set screen size.
await page.setViewport({ width: 1080, height: 1024 });

if (partners.length > 0) {
  console.log(`Searching for partners: ${partners.join(", ")} in Esfera...`);
} else {
  console.log("Searching all partners  in Esfera...");
}

// Extract the required information
const data = await page.$$eval(".box-partner-custom", (cards) =>
  cards.map((card) => {
    const partnerName = card.querySelector(
      '[data-bind="text: $data.displayName"]'
    );
    const amountElement = card.querySelector(
      '[data-bind="text: $parent.accumulationPointsConvert($data.esf_accumulationAmount)"]'
    ); // Get currency
    const accumulationRuleElement = card.querySelector(".textPoints");

    const accumulationText = accumulationRuleElement
      ? accumulationRuleElement.textContent.trim()
      : null;

    let currency = "CUSTOM";
    if (accumulationText) {
      if (
        accumulationText.includes("real") ||
        accumulationText.includes("reais")
      ) {
        currency = "R$";
      } else if (accumulationText.includes("dólar")) {
        currency = "U$";
      }
    }

    return {
      program: "Esfera",
      partner: partnerName ? partnerName.textContent.trim() : null,
      currency,
      value: accumulationText.match(/(\d+,\d+)/g) ?? "1",
      parity: amountElement ? amountElement.textContent.trim() : null,
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
