import { chromium } from "playwright";
import { resolve, dirname, basename, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync, existsSync } from "node:fs";

const TITLE = "Juridische technologie";
const STATUS = "Concept";

const htmlFiles = [
  "index.html",
  "typologie.html",
  "catalogus.html",
  "begrippenkader.html",
  "ontologie.html",
];

function headerTemplate() {
  return `
    <div style="
      width: 100%;
      font-size: 9px;
      padding: 0 40px;
      color: #666;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
    ">
      <span>${TITLE}</span>
      <span>${STATUS}</span>
    </div>
  `;
}

function footerTemplate() {
  return `
    <div style="
      width: 100%;
      font-size: 9px;
      padding: 0 40px;
      color: #666;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
    ">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
  `;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const outputDir = resolve("dist", "pdf");
  mkdirSync(outputDir, { recursive: true });

  for (const htmlFile of htmlFiles) {
    const filePath = resolve("dist", htmlFile);

    if (!existsSync(filePath)) {
      console.warn(`Overgeslagen (niet gevonden): ${filePath}`);
      continue;
    }

    const fileUrl = pathToFileURL(filePath).toString();
    const pdfFileName = `${basename(htmlFile, extname(htmlFile))}.pdf`;
    const pdfOutput = resolve(outputDir, pdfFileName);

    await page.goto(fileUrl, { waitUntil: "load" });

    await page.pdf({
      path: pdfOutput,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerTemplate(),
      footerTemplate: footerTemplate(),
      margin: {
        top: "60px",
        bottom: "60px",
        left: "40px",
        right: "40px",
      },
    });

    console.log(`PDF klaar: ${pdfOutput}`);
  }

  await browser.close();
})();
