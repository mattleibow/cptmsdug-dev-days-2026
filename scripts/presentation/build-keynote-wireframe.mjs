import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import PptxGenJS from "pptxgenjs";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const sourceMedia = path.join(__dirname, ".keynote-source-media");
const workRoot = path.join(__dirname, ".keynote-work");
const sourceDeck = path.join(root, "docs/source-material/copilot-app-english.pptx");
const output = path.join(root, "docs/decks/drafts/copilot-keynote-wireframe.pptx");
const retargetNativeSlides = path.join(__dirname, "retarget-native-slides.py");

const C = {
  ink: "101411",
  surface: "232925",
  mineral: "E4EBE6",
  white: "FFFFFF",
  soft: "BFFFD1",
  green: "0E6836",
  active: "0FBF3E",
  quiet: "909692",
};
const S = { rect: "rect", rightArrow: "rightArrow" };

const event = (file) => path.join(root, "docs/assets/event", file);
const source = (file) => path.join(sourceMedia, "ppt/media", file);
const speaker = (file) => event(path.join("speakers", file));
const videos = [
  ["Parallel agent sessions", "A desktop workbench for deliberate workspace choices.", "01-sessions.mp4", "01-sessions.mp4.png"],
  ["One centralized inbox", "Issues, pull requests, repositories — attention in one place.", "02-my-work.mp4", "02-my-work.mp4.png"],
  ["A shared work surface", "Chat is good for intent. Shared work needs a surface.", "03-canvases.mp4", "03-canvases.mp4.png"],
  ["Review where work happened", "Diffs, checks, repair, and a normal merge decision.", "04-review-and-merge.mp4", "04-review-and-merge.mp4.png"],
  ["Teach it. Connect it. Repeat it.", "Turn expertise and guarded prompts into repeatable work.", "05-automations.mp4", "05-automations.mp4.png"],
].map(([title, caption, file, poster]) => ({
  title,
  caption,
  path: path.join(root, "docs/assets/copilot-app-videos", file),
  posterPath: path.join(root, "docs/assets/copilot-app-video-posters", poster),
}));

function extractSourceMedia() {
  fs.rmSync(sourceMedia, { recursive: true, force: true });
  fs.mkdirSync(sourceMedia, { recursive: true });
  execFileSync("unzip", [
    "-qq",
    sourceDeck,
    "ppt/media/*",
    "-d",
    sourceMedia,
  ]);
}

function appleScriptString(value) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function restoreNativeSlides(generatedDeck) {
  const work = fs.mkdtempSync(path.join(workRoot, "native-slides-"));
  const token = `${process.pid}-${Date.now()}`;
  const sourceCopy = path.join(work, `source-${token}.pptx`);
  const targetCopy = path.join(work, `keynote-${token}.pptx`);

  fs.copyFileSync(sourceDeck, sourceCopy);
  fs.copyFileSync(generatedDeck, targetCopy);

  const sourceName = path.basename(sourceCopy);
  const targetName = path.basename(targetCopy);
  const featureCopies = [
    [9, 12],
    [10, 13],
    [11, 14],
    [12, 15],
    [13, 16],
  ]
    .map(
      ([sourceSlide, targetSlide]) => `
      copy object (slide ${sourceSlide} of srcPres)
      paste object dstPres
      move (last slide of dstPres) to before slide ${targetSlide} of dstPres`,
    )
    .join("\n");

  const script = `
with timeout of 300 seconds
  tell application "Microsoft PowerPoint"
    open POSIX file "${appleScriptString(sourceCopy)}"
    set srcPres to presentation "${appleScriptString(sourceName)}"
    open POSIX file "${appleScriptString(targetCopy)}"
    set dstPres to presentation "${appleScriptString(targetName)}"

    copy object (slide 3 of srcPres)
    paste object dstPres
    move (last slide of dstPres) to before slide 6 of dstPres
    delete slide 7 of dstPres

${featureCopies}

    repeat 5 times
      delete slide 17 of dstPres
    end repeat

    save dstPres
    close dstPres saving yes
    close srcPres saving no
  end tell
end timeout
`;

  try {
    execFileSync("osascript", [], {
      input: script,
      stdio: ["pipe", "inherit", "inherit"],
    });
    execFileSync("python3", [retargetNativeSlides, targetCopy], {
      stdio: "inherit",
    });
    fs.copyFileSync(targetCopy, output);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

function note(slide, text) {
  slide.addNotes(text);
  return slide;
}

function text(slide, value, options = {}) {
  slide.addText(value, {
    fontFace: "Aptos",
    fontSize: 18,
    color: C.ink,
    margin: 0.03,
    breakLine: false,
    fit: "shrink",
    ...options,
  });
}

function display(slide, value, options = {}) {
  text(slide, value, {
    fontFace: "Aptos Display",
    bold: true,
    fontSize: 34,
    margin: 0,
    ...options,
  });
}

function label(slide, value, options = {}) {
  text(slide, value.toUpperCase(), {
    fontFace: "Aptos",
    bold: true,
    fontSize: 9.5,
    charSpacing: 1.3,
    margin: 0,
    ...options,
  });
}

function addStage(slide, dark = true, texture = "image53.png") {
  if (dark) {
    slide.background = { color: C.ink };
    slide.addImage({
      path: source(texture),
      sizing: { type: "crop", x: 0, y: 0, w: 13.333, h: 7.5 },
      transparency: 30,
      altText: "Subtle official Copilot texture",
    });
  } else {
    slide.background = { color: C.mineral };
  }
}

function rail(slide, y, dark = true, active = false) {
  slide.addShape(S.rect, {
    x: 0.67, y, w: 12, h: 0.07,
    line: { color: active ? C.active : C.green, transparency: 100 },
    fill: { color: active ? C.active : C.green },
  });
  slide.addShape(S.rect, {
    x: 0.67, y: y - 0.08, w: 0.18, h: 0.23,
    line: { color: dark ? C.mineral : C.ink, transparency: 100 },
    fill: { color: dark ? C.mineral : C.ink },
  });
}

function image(slide, file, x, y, w, h, altText) {
  slide.addImage({
    ...(file.startsWith("data:") ? { data: file } : { path: file }),
    x, y, w, h,
    altText,
  });
}

function crop(slide, file, x, y, w, h, altText) {
  slide.addImage({
    path: file,
    x, y, w, h,
    altText,
  });
}

function block(slide, x, y, w, h, fill, line = fill) {
  slide.addShape(S.rect, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: line, width: 0.8 },
  });
}

function arrow(slide, x, y, w, h, color = C.soft) {
  slide.addShape(S.rightArrow, {
    x, y, w, h,
    fill: { color },
    line: { color },
  });
}

function speakerPhoto(slide, file, x, y, size = 0.55) {
  crop(slide, speaker(file), x, y, size, size, "Session speaker portrait");
}

function agendaRow(slide, values) {
  const { time, title, name, photo, y, titleSize = 20 } = values;
  block(slide, 0.68, y, 11.98, 1.22, C.white);
  text(slide, time, {
    x: 0.95, y: y + 0.22, w: 1.1, h: 0.35,
    fontFace: "Aptos Display", fontSize: 20, bold: true, color: C.green,
  });
  speakerPhoto(slide, photo, 2.18, y + 0.25, 0.66);
  display(slide, title, {
    x: 3.1, y: y + 0.15, w: 8.95, h: 0.54,
    fontSize: titleSize, color: C.ink, valign: "mid",
  });
  text(slide, name, {
    x: 3.1, y: y + 0.79, w: 8.95, h: 0.22,
    fontSize: 12, bold: true, color: C.surface,
  });
}

function addVideoSlide(pptx, video, index) {
  const slide = note(pptx.addSlide(), `Feature reel ${index}/5. Introduce this surface in one sentence, then let the clip carry the detail.`);
  addStage(slide, index % 2 === 1);
  const dark = index % 2 === 1;
  const fg = dark ? C.mineral : C.ink;
  const sub = dark ? C.soft : C.surface;
  display(slide, video.title, { x: 0.7, y: 0.55, w: 8.9, h: 0.58, fontSize: 32, color: fg });
  text(slide, video.caption, { x: 0.7, y: 1.25, w: 9.3, h: 0.32, fontSize: 16, color: sub });
  label(slide, `${index} / 5`, { x: 11.58, y: 0.67, w: 1.05, h: 0.18, color: dark ? C.active : C.green, align: "right" });
  block(slide, 0.7, 1.82, 11.93, 5.02, C.ink, dark ? C.soft : C.green);
  const cover = `data:image/png;base64,${fs.readFileSync(video.posterPath).toString("base64")}`;
  slide.addMedia({
    type: "video",
    path: video.path,
    cover,
    x: 0.76, y: 1.88, w: 11.81, h: 4.9,
  });
  rail(slide, 7.02, dark, index === 3);
  return slide;
}

async function main() {
  fs.rmSync(workRoot, { recursive: true, force: true });
  fs.mkdirSync(workRoot, { recursive: true });
  extractSourceMedia();
  const eventQr = await QRCode.toDataURL("https://cptmsdug.dev/dev-days-2026.html", {
    errorCorrectionLevel: "M", margin: 1, width: 600,
    color: { dark: "#101411", light: "#E4EBE6" },
  });
  const feedbackQr = await QRCode.toDataURL("https://gh.io/dev-days/feedback", {
    errorCorrectionLevel: "M", margin: 1, width: 600,
    color: { dark: "#101411", light: "#E4EBE6" },
  });

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Matthew Leibowitz";
  pptx.company = "Cape Town MS Developer User Group";
  pptx.subject = "Dev Days Cape Town 2026 keynote";
  pptx.title = "Dev Days Cape Town 2026";
  pptx.lang = "en-ZA";
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos", lang: "en-ZA" };

  // 1 — Community welcome
  {
    const slide = note(pptx.addSlide(), "Welcome the room. This is a day for builders: learn a workflow, try it on something real, and compare notes with other developers.");
    crop(slide, event("branding/devdays2026hero.png"), 0, -0.06, 13.333, 7.62, "Dev Days Cape Town hero artwork with mascot and GitHub cube");
    block(slide, 0.58, 0.56, 5.35, 2.63, C.ink);
    display(slide, "Dev Days\nCape Town 2026", { x: 0.86, y: 0.83, w: 4.65, h: 1.1, fontSize: 33, color: C.white, breakLine: true });
    text(slide, "GitHub Copilot Community Event\n3 October 2026 · BBD Cape Town\nA day for builders", { x: 0.9, y: 2.1, w: 4.62, h: 0.72, fontSize: 15, bold: true, color: C.soft, breakLine: true });
    rail(slide, 3.39, true, true);
  }

  // 2 — Community
  {
    const slide = note(pptx.addSlide(), "Thank the user group, organizers, volunteers, speakers, venue, sponsors, and everyone investing a full day in the community. Sponsor list is intentionally limited to confirmed public partners.");
    addStage(slide, false);
    label(slide, "Dev Days is built by people", { x: 0.7, y: 0.52, w: 4, h: 0.2, color: C.green });
    display(slide, "Built by the\ncommunity.", { x: 0.68, y: 0.9, w: 5.25, h: 1.18, fontSize: 42, color: C.ink, breakLine: true });
    image(slide, event("branding/cptmsdugcolor.png"), 0.75, 2.45, 1.55, 1.55, "Cape Town MS Developer User Group logo");
    display(slide, "Cape Town MS\nDev User Group", { x: 2.55, y: 2.58, w: 4.2, h: 0.76, fontSize: 24, color: C.ink, breakLine: true });
    text(slide, "Allan Pead · Carike Botha · Matthew Leibowitz", { x: 2.55, y: 3.58, w: 5.2, h: 0.25, fontSize: 13.5, bold: true, color: C.surface });
    block(slide, 7.65, 1.03, 4.98, 4.85, C.ink);
    label(slide, "With confirmed public support from", { x: 8.05, y: 1.46, w: 3.9, h: 0.2, color: C.soft });
    image(slide, event("sponsors/microsoftlogo.png"), 8.15, 2.05, 3.65, 0.85, "Microsoft logo");
    text(slide, "Headline sponsor", { x: 8.18, y: 3.03, w: 3.4, h: 0.22, fontSize: 12, bold: true, color: C.soft });
    image(slide, event("sponsors/bbd.png"), 8.15, 3.92, 3.65, 1.05, "BBD logo");
    text(slide, "Venue sponsor", { x: 8.18, y: 5.05, w: 3.4, h: 0.22, fontSize: 12, bold: true, color: C.soft });
    rail(slide, 6.53, false, true);
  }

  // 3 — Morning programme
  {
    const slide = note(pptx.addSlide(), "The keynote is already underway, so this agenda begins with the next session. Mention movement breaks verbally; land the clear lunch endpoint.");
    addStage(slide, true, "image10.png");
    label(slide, "Programme · Morning", { x: 0.7, y: 0.46, w: 3.2, h: 0.2, color: C.soft });
    display(slide, "Make the day yours.", { x: 0.68, y: 0.78, w: 8.4, h: 0.52, fontSize: 32, color: C.mineral });
    agendaRow(slide, { time: "09:30", title: "GitHub Copilot App — the agent driven development environment", name: "Matthew Leibowitz", photo: "matthew-leibowitz.jpg", y: 1.6, titleSize: 19 });
    agendaRow(slide, { time: "10:25", title: "The Goema Sessions: Improvising Data Analysis with GitHub Copilot CLI", name: "Niels Berglund", photo: "niels-berglund.jpg", y: 3.0, titleSize: 18 });
    agendaRow(slide, { time: "11:20", title: "Your First Business Agent: Email, MCP, Copilot Studio & Business Central", name: "Berny During", photo: "berny-during.jpg", y: 4.4, titleSize: 18 });
    block(slide, 0.68, 5.93, 11.98, 0.62, C.green);
    display(slide, "12:05  /  Lunch", { x: 0.95, y: 6.05, w: 3.7, h: 0.25, fontSize: 20, color: C.white });
  }

  // 4 — Afternoon programme
  {
    const slide = note(pptx.addSlide(), "Show the afternoon’s progression from code apps and safe use into a community project and the hands-on workshop. Point to the QR for the full current schedule.");
    addStage(slide, false);
    label(slide, "Programme · Afternoon", { x: 0.7, y: 0.45, w: 3.2, h: 0.2, color: C.green });
    display(slide, "Make the day yours.", { x: 0.68, y: 0.77, w: 7.2, h: 0.52, fontSize: 32, color: C.ink });
    block(slide, 0.68, 1.5, 5.92, 1.62, C.white);
    text(slide, "12:45", { x: 0.94, y: 1.76, w: 1.05, h: 0.3, fontFace: "Aptos Display", fontSize: 20, bold: true, color: C.green });
    speakerPhoto(slide, "carike-botha.jpg", 2.06, 1.78, 0.62);
    display(slide, "Beyond Drag and Drop: AI-Powered Code Apps with GitHub Copilot CLI", { x: 2.91, y: 1.68, w: 3.35, h: 0.72, fontSize: 17.2, color: C.ink });
    text(slide, "Carike Botha", { x: 2.91, y: 2.68, w: 3.2, h: 0.2, fontSize: 12.2, bold: true, color: C.surface });

    block(slide, 0.68, 3.36, 5.92, 1.98, C.white);
    text(slide, "13:40", { x: 0.94, y: 3.64, w: 1.05, h: 0.3, fontFace: "Aptos Display", fontSize: 20, bold: true, color: C.green });
    speakerPhoto(slide, "abed-matini.png", 2.06, 3.66, 0.62);
    display(slide, "Using GitHub Copilot Safely: What Developers Need to Know About AI, Dependencies and Security", { x: 2.91, y: 3.52, w: 3.35, h: 1.06, fontSize: 15.7, color: C.ink });
    text(slide, "Abed Matini", { x: 2.91, y: 4.9, w: 3.2, h: 0.2, fontSize: 12.2, bold: true, color: C.surface });

    block(slide, 6.88, 1.5, 5.74, 2.68, C.white);
    text(slide, "14:35", { x: 7.18, y: 1.79, w: 1.05, h: 0.3, fontFace: "Aptos Display", fontSize: 20, bold: true, color: C.green });
    display(slide, "GreenGuard: Transforming Raw IoT Sensor Data into Accessible Community Farming Insights", { x: 8.34, y: 1.68, w: 3.91, h: 1.03, fontSize: 16.2, color: C.ink });
    for (const [index, file] of ["thapelo-vundla.jpg", "vhutali-tsanwani.jpg", "ntando-ndawonde.jpg", "tidimatso-malatji.jpg"].entries()) {
      speakerPhoto(slide, file, 7.18 + index * 0.72, 2.86, 0.54);
    }
    text(slide, "Thapelo Vundla · Vhutali Tsanwani · Ntando Ndawonde · Tidimatso Malatji", { x: 10.15, y: 2.9, w: 2.12, h: 0.45, fontSize: 11.2, bold: true, color: C.surface });

    block(slide, 6.88, 4.43, 5.74, 0.92, C.ink);
    display(slide, "15:00  /  Workshop", { x: 7.18, y: 4.65, w: 2.95, h: 0.27, fontSize: 18.5, color: C.mineral });
    text(slide, "Allan Pead · Carike Botha · Matthew Leibowitz", { x: 10.1, y: 4.69, w: 2.16, h: 0.22, fontSize: 10.8, bold: true, color: C.soft });

    block(slide, 0.68, 5.68, 11.94, 0.73, C.green);
    image(slide, eventQr, 11.12, 5.78, 0.54, 0.54, "QR code for the Dev Days event schedule");
    label(slide, "Full schedule", { x: 0.98, y: 5.93, w: 1.55, h: 0.17, color: C.white });
    text(slide, "cptmsdug.dev/dev-days-2026.html", { x: 2.72, y: 5.9, w: 4.2, h: 0.22, fontSize: 12.8, bold: true, color: C.white });
    text(slide, "Sessions · speakers · updates", { x: 7.25, y: 5.94, w: 3.45, h: 0.18, fontSize: 11.2, color: C.soft, align: "right" });
  }

  // 5 — Evolution
  {
    const slide = note(pptx.addSlide(), "Copilot started by helping us type. Suggestions became planning, implementation and review; now some work can continue asynchronously. The developer remains responsible.");
    addStage(slide, true);
    label(slide, "A developer-directed evolution", { x: 0.7, y: 0.52, w: 4, h: 0.2, color: C.soft });
    display(slide, "Software development is\nbecoming a team sport.", { x: 0.68, y: 0.88, w: 6.7, h: 1.05, fontSize: 37, color: C.mineral, breakLine: true });
    rail(slide, 3.6, true);
    const phases = [
      ["ASSIST", "Pair on the next move", "image23.png"],
      ["COLLABORATE", "Plan, build and review", "image24.png"],
      ["DELEGATE", "Continue bounded work", "image22.png"],
    ];
    phases.forEach(([name, caption, asset], i) => {
      const x = 0.76 + i * 4.12;
      image(slide, source(asset), x + 0.82, 2.02, 1.52, 1.52, `Official Copilot 3D actor for ${name.toLowerCase()}`);
      display(slide, name, { x, y: 4.02, w: 3.45, h: 0.34, fontSize: 21, color: i === 2 ? C.active : C.soft, align: "center" });
      text(slide, caption, { x, y: 4.52, w: 3.45, h: 0.28, fontSize: 13, color: C.mineral, align: "center" });
      if (i < 2) arrow(slide, x + 3.38, 3.37, 0.55, 0.34, C.green);
    });
    image(slide, source("image33.png"), 9.75, 5.08, 2.35, 1.22, "Official Copilot 3D cube");
  }

  // 6 — Lifecycle
  {
    const slide = note(pptx.addSlide(), "Agents can participate across lifecycle stages. Frame that participation with user intent on the front and validation before the decision to ship.");
    addStage(slide, false);
    label(slide, "The loop stays accountable", { x: 0.7, y: 0.52, w: 4, h: 0.2, color: C.green });
    display(slide, "Plan. Build. Review. Ship.", { x: 0.68, y: 0.9, w: 9.8, h: 0.55, fontSize: 35, color: C.ink });
    block(slide, 0.7, 1.85, 2.25, 0.72, C.ink);
    label(slide, "User intent", { x: 0.95, y: 2.08, w: 1.75, h: 0.16, color: C.soft, align: "center" });
    block(slide, 10.47, 1.85, 2.12, 0.72, C.green);
    label(slide, "Validation", { x: 10.72, y: 2.08, w: 1.62, h: 0.16, color: C.white, align: "center" });
    const lifecycle = [["PLAN", "clarify"], ["BUILD", "implement"], ["REVIEW", "inspect"], ["SHIP", "decide"]];
    lifecycle.forEach(([title, sub], i) => {
      const x = 0.92 + i * 3.05;
      block(slide, x, 3.25, 2.28, 1.4, i === 3 ? C.green : C.white, i === 3 ? C.green : C.green);
      display(slide, title, { x, y: 3.56, w: 2.28, h: 0.28, fontSize: 20, color: i === 3 ? C.white : C.ink, align: "center" });
      text(slide, sub, { x, y: 4.02, w: 2.28, h: 0.18, fontSize: 11.5, color: i === 3 ? C.soft : C.surface, align: "center" });
      if (i < 3) arrow(slide, x + 2.36, 3.76, 0.52, 0.35, i === 2 ? C.active : C.green);
    });
    image(slide, source("image29.png"), 5.72, 5.2, 1.9, 1.28, "Official Copilot 3D cube");
    text(slide, "The developer owns the trade-offs and the decision to ship.", { x: 2.23, y: 6.63, w: 8.9, h: 0.26, fontSize: 14, bold: true, color: C.surface, align: "center" });
  }

  // 7 — Ecosystem
  {
    const slide = note(pptx.addSlide(), "Copilot is a family of experiences and extensibility points, not one identical assistant copied into every client.");
    addStage(slide, true, "image11.png");
    display(slide, "Copilot is more than\na chat box.", { x: 0.7, y: 0.7, w: 6.15, h: 1.08, fontSize: 42, color: C.mineral, breakLine: true });
    image(slide, source("image45.png"), 8.2, 0.48, 3.75, 2.45, "Official 3D Copilot artwork");
    rail(slide, 3.28, true);
    image(slide, source("image42.png"), 0.88, 4.0, 11.58, 1.82, "Official Copilot ecosystem artwork");
    ["CODE", "COMMAND", "COLLABORATE"].forEach((word, i) => {
      display(slide, word, { x: 0.87 + i * 4.0, y: 6.18, w: 3.45, h: 0.28, fontSize: 20, color: i === 2 ? C.active : C.soft, align: "center" });
    });
  }

  // 8 — Boundaries map
  {
    const slide = note(pptx.addSlide(), "Use the surface that matches where the work starts, how long it should run, which environment it may change, and how much autonomy is appropriate.");
    addStage(slide, false);
    label(slide, "One Copilot · different execution boundaries", { x: 0.7, y: 0.53, w: 5.6, h: 0.2, color: C.green });
    display(slide, "Where should the work happen?", { x: 0.68, y: 0.9, w: 10.2, h: 0.55, fontSize: 34, color: C.ink });
    block(slide, 4.72, 2.48, 3.88, 2.3, C.ink);
    image(slide, source("image25.png"), 5.99, 2.65, 1.34, 1.28, "Official Copilot 3D actor");
    label(slide, "One Copilot", { x: 5.17, y: 4.13, w: 2.98, h: 0.18, color: C.soft, align: "center" });
    const endpoints = [
      ["IDE", "Local workspace", 0.7, 2.1],
      ["TERMINAL", "Local tools", 0.7, 5.13],
      ["GITHUB", "Hosted branch", 9.58, 2.1],
      ["MOBILE", "Attention", 9.58, 3.7],
      ["COPILOT APP", "Chosen workspace", 9.58, 5.13],
    ];
    endpoints.forEach(([title, desc, x, y], i) => {
      block(slide, x, y, 2.62, 1.03, i === 4 ? C.green : C.white, C.green);
      display(slide, title, { x: x + 0.18, y: y + 0.2, w: 2.25, h: 0.23, fontSize: 16, color: i === 4 ? C.white : C.ink });
      text(slide, desc, { x: x + 0.18, y: y + 0.59, w: 2.2, h: 0.18, fontSize: 10.5, color: i === 4 ? C.soft : C.surface });
      if (x < 4) arrow(slide, x + 2.7, y + 0.37, 1.15, 0.24, C.green);
      if (x > 8.5) arrow(slide, 8.7, y + 0.37, 0.68, 0.24, i === 4 ? C.active : C.green);
    });
  }

  // 9 — IDE
  {
    const slide = note(pptx.addSlide(), "In the IDE, the agent works in the immediate local environment you can see. Use VS Code as the concrete example; do not imply perfect editor parity.");
    addStage(slide, true);
    label(slide, "Work locally · IDE", { x: 0.7, y: 0.49, w: 3.6, h: 0.2, color: C.soft });
    display(slide, "Immediate. Visible. Local.", { x: 0.68, y: 0.84, w: 7.7, h: 0.5, fontSize: 33, color: C.mineral });
    block(slide, 0.7, 1.63, 3.1, 4.85, C.surface);
    const actions = [["01", "ASK", "need an answer"], ["02", "PLAN", "before consequence"], ["03", "IMPLEMENT + VERIFY", "make and check the change"]];
    actions.forEach(([number, title, desc], i) => {
      const y = 2.12 + i * 1.28;
      label(slide, number, { x: 1.02, y, w: 0.4, h: 0.16, color: i === 2 ? C.active : C.soft });
      display(slide, title, { x: 1.02, y: y + 0.28, w: 2.35, h: 0.26, fontSize: i === 2 ? 16.5 : 20, color: C.mineral });
      text(slide, desc, { x: 1.02, y: y + 0.66, w: 2.35, h: 0.18, fontSize: 11, color: C.soft });
    });
    block(slide, 4.25, 1.63, 8.38, 4.85, C.ink, C.green);
    crop(slide, source("image52.png"), 4.33, 1.71, 8.22, 4.69, "Official IDE scene showing Copilot in a development environment");
  }

  // 10 — CLI
  {
    const slide = note(pptx.addSlide(), "A normal Copilot CLI session works locally. Plan first, grant tools deliberately, inspect changes, and use slash delegate only when bounded work should continue as a hosted handoff.");
    addStage(slide, false);
    label(slide, "Work locally · Copilot CLI", { x: 0.7, y: 0.5, w: 4.2, h: 0.2, color: C.green });
    display(slide, "Inspect → plan → act → verify.", { x: 0.68, y: 0.84, w: 8.6, h: 0.54, fontSize: 33, color: C.ink });
    block(slide, 0.7, 1.65, 8.24, 4.95, C.ink);
    label(slide, "local repository / bounded permissions", { x: 1.04, y: 1.98, w: 5.2, h: 0.18, color: C.soft });
    text(slide, "$ copilot\n\n> inspect the repository\n  read code and history\n\n> propose a plan\n  ask before consequential actions\n\n> act, then verify\n  tests · diffs · checks", {
      x: 1.04, y: 2.44, w: 6.9, h: 3.34, fontFace: "Aptos Mono", fontSize: 15.2,
      color: C.mineral, margin: 0.03, breakLine: true,
    });
    block(slide, 9.35, 1.65, 3.28, 4.95, C.green);
    label(slide, "hosted handoff", { x: 9.7, y: 2.0, w: 2.56, h: 0.18, color: C.soft, align: "center" });
    display(slide, "/delegate", { x: 9.63, y: 2.72, w: 2.72, h: 0.34, fontSize: 25, color: C.white, align: "center" });
    text(slide, "Continue bounded work\nin a GitHub-hosted\nenvironment.", { x: 9.68, y: 3.52, w: 2.62, h: 0.65, fontSize: 13.2, bold: true, color: C.soft, align: "center", breakLine: true });
    image(slide, source("image38.png"), 10.22, 4.52, 1.48, 1.14, "Official Copilot 3D agent");
    arrow(slide, 8.9, 3.72, 0.38, 0.34, C.active);
  }

  // 11 — Hosted agent
  {
    const slide = note(pptx.addSlide(), "This is a conceptual hosted flow, not a live screenshot. A GitHub-hosted agent prepares a branch and pull request. CI, review, permissions, and branch protections remain normal repository gates.");
    addStage(slide, true, "image10.png");
    label(slide, "GitHub-hosted cloud agent", { x: 0.7, y: 0.5, w: 4.6, h: 0.2, color: C.soft });
    display(slide, "Let bounded work continue.", { x: 0.68, y: 0.85, w: 8.8, h: 0.54, fontSize: 34, color: C.mineral });
    const flow = [
      "TASK",
      "BRANCH",
      "PULL REQUEST",
      "CHECKS + REVIEW",
      "PROTECTED MERGE",
    ];
    flow.forEach((title, i) => {
      const x = 0.7 + i * 2.48;
      const isFinal = i === 4;
      block(slide, x, 3.14, 2.05, 1.36, isFinal ? C.green : C.surface, isFinal ? C.active : C.green);
      display(slide, title, { x: x + 0.14, y: 3.61, w: 1.77, h: 0.34, fontSize: title.length > 11 ? 14.5 : 18, color: isFinal ? C.white : C.mineral, align: "center" });
      if (i < 4) arrow(slide, x + 2.1, 3.63, 0.3, 0.32, i === 3 ? C.active : C.green);
    });
    image(slide, source("image22.png"), 0.93, 4.95, 1.55, 1.45, "Official Copilot cloud motif");
    text(slide, "Hosted execution changes the boundary — not the engineering gate.", { x: 2.7, y: 5.58, w: 8.45, h: 0.3, fontSize: 17, bold: true, color: C.soft, align: "center" });
    rail(slide, 6.72, true, true);
  }

  // 12–16 — Feature reel
  videos.forEach((video, index) => addVideoSlide(pptx, video, index + 1));

  // 17 — Engineering safety
  {
    const slide = note(pptx.addSlide(), "More capability makes disciplined engineering more important: clear intent, small permissions, visible diffs, tests and checks, and human judgment at the gate.");
    addStage(slide, false);
    label(slide, "Engineering gate", { x: 0.7, y: 0.52, w: 3, h: 0.2, color: C.green });
    display(slide, "The safety model is still\nsoftware engineering.", { x: 0.68, y: 0.86, w: 7.4, h: 1.02, fontSize: 39, color: C.ink, breakLine: true });
    const gates = [
      ["Clear intent", "01"],
      ["Small permissions", "02"],
      ["Visible diffs", "03"],
      ["Tests and checks", "04"],
      ["Human judgment", "05"],
    ];
    slide.addShape(S.rect, {
      x: 7.97, y: 2.13, w: 0.06, h: 3.94,
      fill: { color: C.green },
      line: { color: C.green, transparency: 100 },
    });
    gates.forEach(([item, no], i) => {
      const y = 2.13 + i * 0.83;
      block(slide, 7.78, y, 4.85, 0.62, i === 4 ? C.green : C.white, i === 4 ? C.active : C.green);
      label(slide, no, { x: 8.05, y: y + 0.22, w: 0.34, h: 0.16, color: i === 4 ? C.soft : C.green });
      display(slide, item, { x: 8.62, y: y + 0.17, w: 3.48, h: 0.23, fontSize: 17.5, color: i === 4 ? C.white : C.ink });
    });
    rail(slide, 6.72, false, true);
  }

  // 18 — Close
  {
    const slide = note(pptx.addSlide(), "Invite the room: try one new surface today, meet one new developer, and leave with one reusable workflow. Point to the current schedule, workshop, feedback QR, and community hashtag.");
    addStage(slide, true);
    image(slide, source("image45.png"), 8.85, 0.55, 3.58, 2.48, "Official 3D Copilot closing motif");
    display(slide, "Build something today.", { x: 0.7, y: 0.65, w: 7.8, h: 0.53, fontSize: 38, color: C.mineral });
    display(slide, "Try one new surface.\nMeet one new developer.\nLeave with one workflow.", { x: 0.7, y: 1.58, w: 6.6, h: 1.2, fontSize: 27, color: C.soft, breakLine: true });
    block(slide, 0.7, 3.38, 7.0, 2.75, C.surface);
    label(slide, "Event + community", { x: 1.0, y: 3.7, w: 2.1, h: 0.17, color: C.soft });
    text(slide, "cptmsdug.dev/dev-days-2026.html", { x: 1.0, y: 4.04, w: 5.9, h: 0.25, fontSize: 15.5, bold: true, color: C.mineral });
    label(slide, "Workshop", { x: 1.0, y: 4.64, w: 1.15, h: 0.17, color: C.soft });
    text(slide, "github.github.com/dev-days", { x: 1.0, y: 4.95, w: 5.9, h: 0.25, fontSize: 15.5, bold: true, color: C.mineral });
    text(slide, "#DevDaysCapeTown", { x: 1.0, y: 5.52, w: 4.6, h: 0.25, fontSize: 17, bold: true, color: C.active });
    block(slide, 8.26, 3.38, 4.37, 2.75, C.mineral);
    label(slide, "Feedback", { x: 8.58, y: 3.78, w: 3.74, h: 0.17, color: C.green, align: "center" });
    text(slide, "gh.io/dev-days/feedback", { x: 8.48, y: 4.11, w: 3.94, h: 0.25, fontSize: 13.2, bold: true, color: C.ink, align: "center" });
    text(slide, "Scan to tell us what worked.", { x: 8.55, y: 4.56, w: 2.0, h: 0.2, fontSize: 9.4, color: C.surface, align: "center" });
    image(slide, feedbackQr, 10.75, 4.54, 1.35, 1.35, "QR code for Dev Days feedback");
    text(slide, "Copilot started by helping us type. Today it can help move the work. You still decide where it goes.", { x: 0.72, y: 6.63, w: 11.8, h: 0.28, fontSize: 14, bold: true, color: C.soft, align: "center" });
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  const generatedDeck = path.join(
    workRoot,
    `copilot-keynote-wireframe-${process.pid}-${Date.now()}.pptx`,
  );
  await pptx.writeFile({ fileName: generatedDeck });
  restoreNativeSlides(generatedDeck);
  fs.rmSync(generatedDeck, { force: true });
  console.log(output);
}

try {
  await main();
} finally {
  fs.rmSync(sourceMedia, { recursive: true, force: true });
  fs.rmSync(workRoot, { recursive: true, force: true });
}
