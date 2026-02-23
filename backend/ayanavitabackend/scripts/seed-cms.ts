import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const page = await prisma.cmsPage.upsert({
    where: { slug: "landing" },
    update: {},
    create: { slug: "landing", title: "AYANAVITA Landing", isActive: true },
  });

  const keys = ["hero", "about", "cards", "cta", "footer"];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const section = await prisma.cmsSection.upsert({
      where: { pageId_key: { pageId: page.id, key } },
      update: { sortOrder: i },
      create: { pageId: page.id, key, sortOrder: i, isActive: true },
    });

    for (const locale of ["vi", "en"] as const) {
      await prisma.cmsSectionLocale.upsert({
        where: { sectionId_locale: { sectionId: section.id, locale } },
        update: {},
        create: { sectionId: section.id, locale, status: "DRAFT", draftData: {} },
      });
    }
  }

  console.log("✅ Seed CMS done");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
