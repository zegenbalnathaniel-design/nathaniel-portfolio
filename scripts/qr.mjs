// Writes the contact QR codes as SVG into public/qr. Run: node scripts/qr.mjs
import QRCode from "qrcode";
import { writeFileSync } from "node:fs";

const codes = {
  linkedin: "https://www.linkedin.com/in/nathaniel-zegenbal-193a56351/",
  substack: "https://nathanielzegenbal.substack.com/",
};
for (const [name, url] of Object.entries(codes)) {
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#1A110B", light: "#F4EEE3" },
  });
  writeFileSync(new URL(`../public/qr/${name}.svg`, import.meta.url), svg);
  console.log(name, svg.length, "bytes");
}
