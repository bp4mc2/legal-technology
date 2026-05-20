import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const TITLE = "Juridische technologie";
const STATUS = "Concept";

function headerTemplate() {
  return `
    <div style="width: 100%; font-size: 9px; color: #666; padding: 0 12px;
                display: flex; align-items: center; justify-content: space-between;
                box-sizing: border-box;">
      <div style="flex: 1; text-align: left;">${TITLE}</div>
      <div style="flex: 0; text-align: right;">${STATUS}</div>
    </div>
  `;
}

function footerTemplate() {
  // Let op: Playwright injecteert waarden via speciale class names zoals
  // pageNumber en totalPages (niet via {{pageNumber}}). [1](https://www.w3.org/2011/rdf-wg/wiki/Tips_on_publishing_ReSpec-based_documents)[2](https://respec.org/docs/src.html)
  return `
    <div style="width: 100%; font-size: 9px; color: #666; padding: 0 12px;
                display: flex; align-items: center; justify-content: space-between;
                box-sizing: border-box;">
      <div style="flex: 1; text-align: left;">
        <span class="date"></span>
      </div>
      <div style="flex: 0; text-align: right;">
        <span class="pageNumber"></span>/<span class="totalPages"></span>
      </div>
    </div>
  `;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // We gaan uit van een statische snapshot in dist/index.html.
  const filePath = resolve("dist", "index.html");
  const fileUrl = pathToFileURL(filePath).toString();

  await page.goto(fileUrl, { waitUntil: "load" });

  await page.pdf({
    path: "dist/index.pdf",
    format: "A4",
    printBackground: true, // handig zodat backgrounds/shading mee printen. [2](https://respec.org/docs/src.html)
    displayHeaderFooter: true, // activeert header/footer. [2](https://respec.org/docs/src.html)[4](https://github-wiki-see.page/m/gnab/remark/wiki/configuration)
    headerTemplate: headerTemplate(),
    footerTemplate: footerTemplate(),
    margin: {
      top: "60px",
      bottom: "60px",
      left: "40px",
      right: "40px",
    },
  });

  await browser.close();
  console.log("✅ PDF klaar: dist/index.pdf");
})();

