/**
 * Генерация иллюстраций для 12 аспектов воспитательной среды через fal.ai
 * Запуск: npm run generate:illustrations
 *
 * Процесс: flux/schnell (белый фон) → rembg (прозрачный фон) → public/illustrations/{code}.png
 */

import { fal } from "@fal-ai/client";
import { writeFile, mkdir, access, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/illustrations");

fal.config({ credentials: process.env.FAL_KEY });

// ─── Аспекты ──────────────────────────────────────────────────────────────────

const ASPECTS = [
  {
    code: "social_partners",
    subject:
      "two people shaking hands in the center, network of connected circular nodes around them, partnership collaboration",
  },
  {
    code: "school_active",
    subject:
      "four students sitting at school desks, one student raising hand high, classroom participation, student council",
  },
  {
    code: "teachers",
    subject:
      "teacher figure standing at whiteboard pointing with a pointer, three student silhouettes seated in front, classroom teaching",
  },
  {
    code: "students_involvement",
    subject:
      "large megaphone emitting bold sound waves, group of five small human figures receiving the message, youth engagement",
  },
  {
    code: "competitions",
    subject:
      "tall golden trophy cup with five-pointed star above it, small podium with first second third place winners",
  },
  {
    code: "federal_events",
    subject:
      "monthly calendar page with two highlighted date squares, small flag on a pole in the corner, scheduled events planning",
  },
  {
    code: "parents",
    subject:
      "simple house with triangular roof, adult figure and small child figure standing in front, family and school partnership",
  },
  {
    code: "spaces",
    subject:
      "top-down floor plan of school with three rooms, simple furniture shapes inside each room, educational space blueprint",
  },
  {
    code: "initiatives_center",
    subject:
      "large glowing lightbulb in center with small stars and speech bubbles floating around it, creative ideas hub",
  },
  {
    code: "collectives",
    subject:
      "six small round human figures arranged in a circle around a central node, connected by lines, team collective unity",
  },
  {
    code: "grants",
    subject:
      "official document with horizontal lines and bold checkmark at bottom, three stacked coin circles beside it, funding and grants",
  },
  {
    code: "professional_dev",
    subject:
      "four ascending bar chart columns growing left to right, small graduation cap on top of the tallest bar, professional growth",
  },
];

// ─── Стиль ────────────────────────────────────────────────────────────────────

const BASE_STYLE =
  "hand-drawn pencil and ink sketch illustration, rough imperfect lines, loose gestural strokes, " +
  "gentle cross-hatching for shading, warm sketchbook aesthetic, traditional art feel, " +
  "pure white background, dark pencil lines, warm earthy accent colors, charming hand-crafted details, " +
  "absolutely NO text, NO letters, NO words, NO labels, NO captions, NO numbers, NO typography, " +
  "square composition, centered subject, sketchbook page style";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} при скачивании`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

async function removeBackground(imageUrl) {
  const result = await fal.subscribe("fal-ai/imageutils/rembg", {
    input: { image_url: imageUrl },
    logs: false,
  });
  return result.data.image.url;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Удалить старые light/dark файлы ─────────────────────────────────────────

async function cleanOldFiles() {
  const suffixes = ["light", "dark"];
  let removed = 0;
  for (const aspect of ASPECTS) {
    for (const suffix of suffixes) {
      const old = resolve(OUT_DIR, `${aspect.code}-${suffix}.png`);
      if (await fileExists(old)) {
        await unlink(old);
        removed++;
      }
    }
  }
  if (removed > 0) console.log(`🧹 Удалено ${removed} старых файлов (light/dark версии)\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.FAL_KEY) {
    console.error("❌  FAL_KEY не задан. Добавьте в .env.");
    process.exit(1);
  }

  const force = process.argv.includes("--force");

  await mkdir(OUT_DIR, { recursive: true });
  await cleanOldFiles();

  const total = ASPECTS.length;
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const aspect of ASPECTS) {
    const filename = `${aspect.code}.png`;
    const dest = resolve(OUT_DIR, filename);

    if (!force && await fileExists(dest)) {
      console.log(`⏭  пропуск ${filename} (уже есть)`);
      skipped++;
      done++;
      continue;
    }

    const prompt = `${BASE_STYLE}, ${aspect.subject}`;
    console.log(`🎨  [${done + 1}/${total}] ${filename}…`);

    try {
      // Шаг 1: генерация
      const genResult = await fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt,
          image_size: "square_hd",
          num_images: 1,
          num_inference_steps: 4,
        },
        logs: false,
      });

      const rawUrl = genResult.data.images[0].url;
      console.log(`   🔄 удаление фона…`);

      // Шаг 2: удаление фона
      const transparentUrl = await removeBackground(rawUrl);

      // Шаг 3: сохранение
      await downloadImage(transparentUrl, dest);
      console.log(`   ✅ сохранено → public/illustrations/${filename}`);
    } catch (err) {
      console.error(`   ❌ ошибка: ${err.message}`);
      failed++;
    }

    done++;
    await sleep(800);
  }

  console.log(`\n✨ Готово! Сгенерировано: ${done - skipped - failed}, пропущено: ${skipped}, ошибок: ${failed}.`);
  if (failed > 0) console.log("   Повторите запуск — готовые пропустятся автоматически.");
}

main();
