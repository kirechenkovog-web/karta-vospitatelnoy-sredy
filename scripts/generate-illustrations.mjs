/**
 * Генерация иллюстраций для 12 аспектов воспитательной среды через fal.ai
 * Запуск: FAL_KEY=ваш_ключ node scripts/generate-illustrations.mjs
 * Или добавьте FAL_KEY в .env и запустите: npm run generate:illustrations
 */

import { fal } from "@fal-ai/client";
import { writeFile, mkdir, access } from "node:fs/promises";
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
      "two people shaking hands in the center, a network of connected circular nodes around them, partnership and community collaboration",
  },
  {
    code: "school_active",
    subject:
      "four students sitting at school desks, one student eagerly raising hand high, active classroom participation, student council meeting",
  },
  {
    code: "teachers",
    subject:
      "teacher figure standing at whiteboard pointing to content with a pointer, three student silhouettes seated below, educational teaching scene",
  },
  {
    code: "students_involvement",
    subject:
      "large megaphone on the left emitting bold sound waves, group of five small human figures on the right receiving the message, youth engagement",
  },
  {
    code: "competitions",
    subject:
      "tall trophy cup with five-pointed star above it, small podium with first second third place, competition awards ceremony",
  },
  {
    code: "federal_events",
    subject:
      "monthly calendar page with two highlighted date squares, small flag on a pole in the corner, official scheduled events planning",
  },
  {
    code: "parents",
    subject:
      "simple house outline with triangular roof, adult figure and small child figure standing in front, warm family and school partnership",
  },
  {
    code: "spaces",
    subject:
      "top-down architectural floor plan of school with three rooms, simple furniture shapes inside each room, educational space design blueprint",
  },
  {
    code: "initiatives_center",
    subject:
      "large glowing lightbulb in center with small stars and speech bubble shapes floating around it, creative ideas and initiative center",
  },
  {
    code: "collectives",
    subject:
      "six small round human head figures arranged in a circle around a central node, connected by lines, youth team collective unity",
  },
  {
    code: "grants",
    subject:
      "official document with horizontal text lines and bold checkmark at bottom, three stacked coin circles beside it, grant funding and support",
  },
  {
    code: "professional_dev",
    subject:
      "four ascending bar chart columns growing left to right, small graduation cap resting on top of the tallest bar, professional growth development",
  },
];

// ─── Темы ─────────────────────────────────────────────────────────────────────

const THEMES = [
  {
    name: "light",
    bg: "pure white background, light and airy feel",
    palette: "vibrant saturated colors for the main shapes, clean and fresh",
  },
  {
    name: "dark",
    bg: "very dark navy #12121e background, deep and rich",
    palette: "bright vivid neon-leaning colors for the main shapes, glowing slightly",
  },
];

// ─── Стиль ────────────────────────────────────────────────────────────────────

const BASE_STYLE =
  "flat digital illustration, minimalist vector art, bold simple geometric shapes, " +
  "no text, no labels, no gradients, no drop shadows, square composition, " +
  "centered subject, clean edges, modern app icon aesthetic, high quality render";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading image`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.FAL_KEY) {
    console.error("❌  FAL_KEY не задан. Добавьте в .env или передайте как переменную окружения.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const total = ASPECTS.length * THEMES.length;
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const aspect of ASPECTS) {
    for (const theme of THEMES) {
      const filename = `${aspect.code}-${theme.name}.png`;
      const dest = resolve(OUT_DIR, filename);

      if (await fileExists(dest)) {
        console.log(`⏭  пропуск ${filename} (уже есть)`);
        skipped++;
        done++;
        continue;
      }

      const prompt = [BASE_STYLE, theme.bg, theme.palette, aspect.subject].join(", ");

      console.log(`🎨  [${done + 1}/${total}] ${filename}…`);

      try {
        const result = await fal.subscribe("fal-ai/flux/schnell", {
          input: {
            prompt,
            image_size: "square_hd",
            num_images: 1,
            num_inference_steps: 4,
          },
          logs: false,
        });

        const imageUrl = result.data.images[0].url;
        await downloadImage(imageUrl, dest);
        console.log(`   ✅ сохранено → public/illustrations/${filename}`);
      } catch (err) {
        console.error(`   ❌ ошибка: ${err.message}`);
        failed++;
      }

      done++;

      // небольшая пауза между запросами
      await sleep(600);
    }
  }

  console.log(`\n✨ Готово! ${done - skipped - failed} сгенерировано, ${skipped} пропущено, ${failed} ошибок.`);
  if (failed > 0) {
    console.log("   Повторите запуск — уже сохранённые пропустятся автоматически.");
  }
}

main();
