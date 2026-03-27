import { fal } from "@fal-ai/client";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

fal.config({ credentials: "602727ae-941b-4e32-a8f5-74fc65a32e17:13fbc1d391e679cfe9f477dc134541ed" });

const BASE_STYLE = "isometric flat design illustration, white background, teal turquoise and golden yellow color palette, small 3D cartoon characters, clean modern vector art style, professional education theme, square composition, centered subject";

const ASPECTS = [
  {
    code: "social_partners",
    prompt: `Two professionals shaking hands on a circular platform, network of golden connection nodes radiating outward, teal islands in background. ${BASE_STYLE}`,
  },
  {
    code: "school_active",
    prompt: `Group of students standing together on isometric platform, star badges, student council meeting, young leaders, teal stage. ${BASE_STYLE}`,
  },
  {
    code: "teachers",
    prompt: `Teachers collaborating around a table, lesson planning, books and charts, warm classroom setting, educators discussing. ${BASE_STYLE}`,
  },
  {
    code: "students_involvement",
    prompt: `Students engaged in various activities, volunteering, social action, diverse group on teal platform, community events. ${BASE_STYLE}`,
  },
  {
    code: "competitions",
    prompt: `Golden trophy cups on podium with number 1 2 3 platforms, medals, confetti stars, winners celebrating. ${BASE_STYLE}`,
  },
  {
    code: "federal_events",
    prompt: `Large calendar with events marked, small figures organizing a festival, flags and banners, event planning stage. ${BASE_STYLE}`,
  },
  {
    code: "parents",
    prompt: `Parents and children together, family gathered around school activity, parent-teacher meeting, warm community scene. ${BASE_STYLE}`,
  },
  {
    code: "spaces",
    prompt: `Isometric school room interior with creative learning spaces, cozy reading corner, art wall, plants, modern classroom design. ${BASE_STYLE}`,
  },
  {
    code: "initiatives_center",
    prompt: `Large glowing lightbulb surrounded by small children with ideas, creativity hub, stars and sparkles, innovation center. ${BASE_STYLE}`,
  },
  {
    code: "collectives",
    prompt: `Multiple groups of children in different circles, teams and clubs, diverse activities, collective teamwork on teal terrain. ${BASE_STYLE}`,
  },
  {
    code: "grants",
    prompt: `Stack of golden coins and documents, growth chart arrows going up, funding and finance symbols, successful grant receipt. ${BASE_STYLE}`,
  },
  {
    code: "professional_dev",
    prompt: `Bar chart growing tall with graduation cap on top, person studying and growing professionally, career development, books and diplomas. ${BASE_STYLE}`,
  },
];

async function generateImage(aspect) {
  console.log(`Generating: ${aspect.code}...`);
  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: aspect.prompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
      },
    });

    const imageUrl = result.data.images[0].url;
    console.log(`  URL: ${imageUrl}`);

    // Download image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const outputPath = join(__dirname, "../public/illustrations/square", `${aspect.code}.png`);
    writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`  Saved: ${aspect.code}.png`);
  } catch (err) {
    console.error(`  Error for ${aspect.code}:`, err.message);
  }
}

// Create output dir
import { mkdirSync } from "fs";
mkdirSync(join(__dirname, "../public/illustrations/square"), { recursive: true });

// Generate sequentially to avoid rate limits
for (const aspect of ASPECTS) {
  await generateImage(aspect);
  await new Promise((r) => setTimeout(r, 500));
}

console.log("Done!");
