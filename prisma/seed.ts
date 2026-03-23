import { PrismaClient, CardNetwork, RewardType, CapPeriod, DataSource } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Categories ───────────────────────────────────────────────────────────────

const categoryData = [
  { name: "Groceries",        slug: "groceries",       icon: "shopping-cart",  sortOrder: 1 },
  { name: "Dining",           slug: "dining",          icon: "utensils",       sortOrder: 2 },
  { name: "Gas & Fuel",       slug: "gas",             icon: "fuel",           sortOrder: 3 },
  { name: "Travel",           slug: "travel",          icon: "plane",          sortOrder: 4 },
  { name: "Online Shopping",  slug: "online-shopping", icon: "shopping-bag",   sortOrder: 5 },
  { name: "General",          slug: "general",         icon: "store",          sortOrder: 6 },
];

// ─── Cards ────────────────────────────────────────────────────────────────────

const cardData = [
  {
    issuer:        "Chase",
    cardName:      "Freedom Flex",
    network:       CardNetwork.VISA,
    annualFee:     0,
    rewardType:    RewardType.CASHBACK,
    baseRewardPct: 0.01,   // 1% base
    imageUrl:      null,
  },
  {
    issuer:        "Chase",
    cardName:      "Sapphire Preferred",
    network:       CardNetwork.VISA,
    annualFee:     95,
    rewardType:    RewardType.POINTS,
    baseRewardPct: 0.01,   // 1x base
    imageUrl:      null,
  },
  {
    issuer:        "American Express",
    cardName:      "Gold Card",
    network:       CardNetwork.AMEX,
    annualFee:     250,
    rewardType:    RewardType.POINTS,
    baseRewardPct: 0.01,   // 1x base
    imageUrl:      null,
  },
  {
    issuer:        "American Express",
    cardName:      "Blue Cash Preferred",
    network:       CardNetwork.AMEX,
    annualFee:     95,
    rewardType:    RewardType.CASHBACK,
    baseRewardPct: 0.01,   // 1% base
    imageUrl:      null,
  },
  {
    issuer:        "Citi",
    cardName:      "Double Cash",
    network:       CardNetwork.MASTERCARD,
    annualFee:     0,
    rewardType:    RewardType.CASHBACK,
    baseRewardPct: 0.02,   // 2% flat
    imageUrl:      null,
  },
  {
    issuer:        "Capital One",
    cardName:      "Quicksilver",
    network:       CardNetwork.VISA,
    annualFee:     0,
    rewardType:    RewardType.CASHBACK,
    baseRewardPct: 0.015,  // 1.5% flat
    imageUrl:      null,
  },
  {
    issuer:        "Discover",
    cardName:      "it Cash Back",
    network:       CardNetwork.DISCOVER,
    annualFee:     0,
    rewardType:    RewardType.CASHBACK,
    baseRewardPct: 0.01,   // 1% base
    imageUrl:      null,
  },
  {
    issuer:        "Wells Fargo",
    cardName:      "Active Cash",
    network:       CardNetwork.VISA,
    annualFee:     0,
    rewardType:    RewardType.CASHBACK,
    baseRewardPct: 0.02,   // 2% flat
    imageUrl:      null,
  },
  {
    issuer:        "Goldman Sachs",
    cardName:      "Apple Card",
    network:       CardNetwork.MASTERCARD,
    annualFee:     0,
    rewardType:    RewardType.CASHBACK,
    baseRewardPct: 0.01,   // 1% base, 2% Apple Pay, 3% at select merchants
    imageUrl:      null,
  },
  {
    issuer:        "Built",
    cardName:      "Built Card",
    network:       CardNetwork.VISA,
    annualFee:     0,
    rewardType:    RewardType.CASHBACK,
    baseRewardPct: 0.02,   // 2% general, bonus at gas/construction
    imageUrl:      null,
  },
];

// ─── Stores ───────────────────────────────────────────────────────────────────

const storeData = [
  // General
  { name: "Target",      slug: "target",      categorySlug: "general",         websiteDomain: "target.com",      merchantMcc: "5311" },
  { name: "Walmart",     slug: "walmart",     categorySlug: "general",         websiteDomain: "walmart.com",     merchantMcc: "5310" },
  { name: "Home Depot",  slug: "home-depot",  categorySlug: "general",         websiteDomain: "homedepot.com",   merchantMcc: "5200" },
  { name: "Best Buy",    slug: "best-buy",    categorySlug: "general",         websiteDomain: "bestbuy.com",     merchantMcc: "5732" },
  { name: "CVS",         slug: "cvs",         categorySlug: "general",         websiteDomain: "cvs.com",         merchantMcc: "5912" },
  // Online Shopping
  { name: "Amazon",      slug: "amazon",      categorySlug: "online-shopping", websiteDomain: "amazon.com",      merchantMcc: "5999" },
  { name: "eBay",        slug: "ebay",        categorySlug: "online-shopping", websiteDomain: "ebay.com",        merchantMcc: "5999" },
  { name: "Etsy",        slug: "etsy",        categorySlug: "online-shopping", websiteDomain: "etsy.com",        merchantMcc: "5999" },
  // Groceries
  { name: "Costco",      slug: "costco",      categorySlug: "groceries",       websiteDomain: "costco.com",      merchantMcc: "5300" },
  { name: "Whole Foods", slug: "whole-foods", categorySlug: "groceries",       websiteDomain: "wholefoodsmarket.com", merchantMcc: "5411" },
  { name: "Kroger",      slug: "kroger",      categorySlug: "groceries",       websiteDomain: "kroger.com",      merchantMcc: "5411" },
  { name: "Trader Joe's", slug: "trader-joes", categorySlug: "groceries",      websiteDomain: "traderjoes.com",  merchantMcc: "5411" },
  { name: "Safeway",     slug: "safeway",     categorySlug: "groceries",       websiteDomain: "safeway.com",     merchantMcc: "5411" },
  // Gas
  { name: "Shell",       slug: "shell",       categorySlug: "gas",             websiteDomain: "shell.com",       merchantMcc: "5541" },
  { name: "Exxon",       slug: "exxon",       categorySlug: "gas",             websiteDomain: "exxon.com",       merchantMcc: "5541" },
  { name: "Mobil",       slug: "mobil",       categorySlug: "gas",             websiteDomain: "mobil.com",       merchantMcc: "5541" },
  { name: "Chevron",     slug: "chevron",     categorySlug: "gas",             websiteDomain: "chevron.com",     merchantMcc: "5541" },
  { name: "BP",          slug: "bp",          categorySlug: "gas",             websiteDomain: "bp.com",          merchantMcc: "5541" },
  // Dining
  { name: "Starbucks",   slug: "starbucks",   categorySlug: "dining",          websiteDomain: "starbucks.com",   merchantMcc: "5814" },
  { name: "Chipotle",    slug: "chipotle",    categorySlug: "dining",          websiteDomain: "chipotle.com",    merchantMcc: "5814" },
  { name: "McDonald's",  slug: "mcdonalds",   categorySlug: "dining",          websiteDomain: "mcdonalds.com",   merchantMcc: "5814" },
  { name: "Panera",      slug: "panera",      categorySlug: "dining",          websiteDomain: "panerabread.com", merchantMcc: "5814" },
  { name: "Subway",      slug: "subway",      categorySlug: "dining",          websiteDomain: "subway.com",      merchantMcc: "5814" },
  { name: "Chick-fil-A", slug: "chick-fil-a", categorySlug: "dining",          websiteDomain: "chick-fil-a.com", merchantMcc: "5814" },
  { name: "Dunkin'",     slug: "dunkin",      categorySlug: "dining",          websiteDomain: "dunkindonuts.com", merchantMcc: "5814" },
  { name: "Domino's",    slug: "dominos",     categorySlug: "dining",          websiteDomain: "dominos.com",     merchantMcc: "5812" },
  // Travel
  { name: "Delta",       slug: "delta",       categorySlug: "travel",          websiteDomain: "delta.com",       merchantMcc: "3000" },
  { name: "United",      slug: "united",      categorySlug: "travel",          websiteDomain: "united.com",      merchantMcc: "3000" },
  { name: "Airbnb",      slug: "airbnb",      categorySlug: "travel",          websiteDomain: "airbnb.com",      merchantMcc: "7011" },
  { name: "Expedia",     slug: "expedia",     categorySlug: "travel",          websiteDomain: "expedia.com",     merchantMcc: "3000" },
];

// ─── Offers ───────────────────────────────────────────────────────────────────
// Each offer references card by "issuer|cardName" and store/category by slug.

type OfferSeed = {
  cardKey:          string;         // "issuer|cardName"
  storeSlug?:       string;
  categorySlug?:    string;
  rewardPct:        number;
  rewardType:       RewardType;
  capAmount?:       number;
  capPeriod?:       CapPeriod;
  bonusDescription?: string;
};

const offerData: OfferSeed[] = [
  // ── Chase Freedom Flex ──────────────────────────────────────────────────────
  // 5% rotating quarterly categories (modelled as Groceries Q1 example)
  {
    cardKey:          "Chase|Freedom Flex",
    categorySlug:     "groceries",
    rewardPct:        0.05,
    rewardType:       RewardType.CASHBACK,
    capAmount:        1500,
    capPeriod:        CapPeriod.QUARTERLY,
    bonusDescription: "5% on rotating quarterly categories (up to $1,500/quarter)",
  },
  // 3% dining
  {
    cardKey:      "Chase|Freedom Flex",
    categorySlug: "dining",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% on dining",
  },
  // 3% drugstores — modelled via CVS store
  {
    cardKey:      "Chase|Freedom Flex",
    storeSlug:    "cvs",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% at drugstores",
  },
  // 5% on travel booked via Chase
  {
    cardKey:          "Chase|Freedom Flex",
    categorySlug:     "travel",
    rewardPct:        0.05,
    rewardType:       RewardType.CASHBACK,
    bonusDescription: "5% on travel booked through Chase Ultimate Rewards",
  },

  // ── Chase Sapphire Preferred ────────────────────────────────────────────────
  // 3x dining
  {
    cardKey:      "Chase|Sapphire Preferred",
    categorySlug: "dining",
    rewardPct:    0.03,
    rewardType:   RewardType.POINTS,
    bonusDescription: "3x points on dining",
  },
  // 3x online grocery
  {
    cardKey:      "Chase|Sapphire Preferred",
    categorySlug: "groceries",
    rewardPct:    0.03,
    rewardType:   RewardType.POINTS,
    bonusDescription: "3x points on online grocery purchases",
  },
  // 2x travel
  {
    cardKey:      "Chase|Sapphire Preferred",
    categorySlug: "travel",
    rewardPct:    0.02,
    rewardType:   RewardType.POINTS,
    bonusDescription: "2x points on travel",
  },
  // 5x travel via Chase portal
  {
    cardKey:          "Chase|Sapphire Preferred",
    categorySlug:     "travel",
    rewardPct:        0.05,
    rewardType:       RewardType.POINTS,
    bonusDescription: "5x points on travel purchased through Chase Ultimate Rewards portal",
  },

  // ── Amex Gold ───────────────────────────────────────────────────────────────
  // 4x groceries (up to $25k/year)
  {
    cardKey:          "American Express|Gold Card",
    categorySlug:     "groceries",
    rewardPct:        0.04,
    rewardType:       RewardType.POINTS,
    capAmount:        25000,
    capPeriod:        CapPeriod.ANNUALLY,
    bonusDescription: "4x Membership Rewards points at U.S. supermarkets (up to $25,000/year)",
  },
  // 4x dining
  {
    cardKey:      "American Express|Gold Card",
    categorySlug: "dining",
    rewardPct:    0.04,
    rewardType:   RewardType.POINTS,
    bonusDescription: "4x Membership Rewards points at restaurants worldwide",
  },
  // 3x flights
  {
    cardKey:      "American Express|Gold Card",
    categorySlug: "travel",
    rewardPct:    0.03,
    rewardType:   RewardType.POINTS,
    bonusDescription: "3x Membership Rewards points on flights booked directly with airlines",
  },

  // ── Amex Blue Cash Preferred ────────────────────────────────────────────────
  // 6% groceries (up to $6k/year)
  {
    cardKey:          "American Express|Blue Cash Preferred",
    categorySlug:     "groceries",
    rewardPct:        0.06,
    rewardType:       RewardType.CASHBACK,
    capAmount:        6000,
    capPeriod:        CapPeriod.ANNUALLY,
    bonusDescription: "6% cash back at U.S. supermarkets (up to $6,000/year)",
  },
  // 6% streaming — modelled as online shopping
  {
    cardKey:          "American Express|Blue Cash Preferred",
    categorySlug:     "online-shopping",
    rewardPct:        0.06,
    rewardType:       RewardType.CASHBACK,
    bonusDescription: "6% cash back on select U.S. streaming subscriptions",
  },
  // 3% gas
  {
    cardKey:      "American Express|Blue Cash Preferred",
    categorySlug: "gas",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% cash back at U.S. gas stations",
  },
  // 3% transit
  {
    cardKey:      "American Express|Blue Cash Preferred",
    categorySlug: "travel",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% cash back on transit (taxis, rideshare, parking, tolls, trains, buses)",
  },

  // ── Discover it Cash Back ────────────────────────────────────────────────────
  // 5% rotating quarterly (Amazon Q4 example)
  {
    cardKey:          "Discover|it Cash Back",
    storeSlug:        "amazon",
    rewardPct:        0.05,
    rewardType:       RewardType.CASHBACK,
    capAmount:        1500,
    capPeriod:        CapPeriod.QUARTERLY,
    bonusDescription: "5% cash back on rotating quarterly categories (up to $1,500/quarter) — Amazon example",
  },
  // 5% gas Q2 example
  {
    cardKey:          "Discover|it Cash Back",
    categorySlug:     "gas",
    rewardPct:        0.05,
    rewardType:       RewardType.CASHBACK,
    capAmount:        1500,
    capPeriod:        CapPeriod.QUARTERLY,
    bonusDescription: "5% cash back on rotating quarterly categories (up to $1,500/quarter) — gas stations example",
  },

  // ── Store-specific highlights ────────────────────────────────────────────────
  // Amex BCP at Whole Foods (Amazon-owned, earns 6% grocery)
  {
    cardKey:          "American Express|Blue Cash Preferred",
    storeSlug:        "whole-foods",
    rewardPct:        0.06,
    rewardType:       RewardType.CASHBACK,
    capAmount:        6000,
    capPeriod:        CapPeriod.ANNUALLY,
    bonusDescription: "6% cash back at Whole Foods (counts as U.S. supermarket)",
  },
  // Chase Freedom Flex at Amazon (online shopping)
  {
    cardKey:      "Chase|Freedom Flex",
    storeSlug:    "amazon",
    rewardPct:    0.05,
    rewardType:   RewardType.CASHBACK,
    capAmount:    1500,
    capPeriod:    CapPeriod.QUARTERLY,
    bonusDescription: "5% at Amazon during rotating quarterly activation",
  },
  // Amex Gold at Starbucks (dining)
  {
    cardKey:      "American Express|Gold Card",
    storeSlug:    "starbucks",
    rewardPct:    0.04,
    rewardType:   RewardType.POINTS,
    bonusDescription: "4x Membership Rewards at Starbucks (counts as dining)",
  },
  // Chase Sapphire Preferred at Starbucks (dining)
  {
    cardKey:      "Chase|Sapphire Preferred",
    storeSlug:    "starbucks",
    rewardPct:    0.03,
    rewardType:   RewardType.POINTS,
    bonusDescription: "3x points at Starbucks (counts as dining)",
  },
  // Amex BCP at Shell (gas)
  {
    cardKey:      "American Express|Blue Cash Preferred",
    storeSlug:    "shell",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% cash back at Shell (U.S. gas station)",
  },
  // Chase Freedom Flex at Shell (gas — rotating)
  {
    cardKey:          "Chase|Freedom Flex",
    storeSlug:        "shell",
    rewardPct:        0.05,
    rewardType:       RewardType.CASHBACK,
    capAmount:        1500,
    capPeriod:        CapPeriod.QUARTERLY,
    bonusDescription: "5% at gas stations during rotating quarterly activation",
  },
  // Chase Sapphire Preferred at Costco (online grocery)
  {
    cardKey:      "Chase|Sapphire Preferred",
    storeSlug:    "costco",
    rewardPct:    0.03,
    rewardType:   RewardType.POINTS,
    bonusDescription: "3x points at Costco.com (counts as online grocery)",
  },
  // Amex Gold at Whole Foods
  {
    cardKey:      "American Express|Gold Card",
    storeSlug:    "whole-foods",
    rewardPct:    0.04,
    rewardType:   RewardType.POINTS,
    bonusDescription: "4x Membership Rewards at Whole Foods (U.S. supermarket)",
  },

  // ── Apple Card (Goldman Sachs) ───────────────────────────────────────────────
  // 3% at select partners (Target, Walgreens, Exxon, T-Mobile, Uber, Nike, Panera)
  {
    cardKey:      "Goldman Sachs|Apple Card",
    storeSlug:    "target",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% Daily Cash when you use Apple Card with Apple Pay at Apple, Nike, Uber, Walgreens, Exxon, T-Mobile, and select merchants",
  },
  {
    cardKey:      "Goldman Sachs|Apple Card",
    storeSlug:    "whole-foods",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% Daily Cash at Apple and select merchants (Apple Pay)",
  },
  {
    cardKey:      "Goldman Sachs|Apple Card",
    storeSlug:    "shell",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% Daily Cash at Exxon and select gas stations (Apple Pay)",
  },
  {
    cardKey:      "Goldman Sachs|Apple Card",
    storeSlug:    "exxon",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% Daily Cash at Exxon and select gas stations (Apple Pay)",
  },
  // 2% Apple Pay everywhere
  {
    cardKey:      "Goldman Sachs|Apple Card",
    categorySlug: "groceries",
    rewardPct:    0.02,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "2% Daily Cash when you use Apple Card with Apple Pay",
  },
  {
    cardKey:      "Goldman Sachs|Apple Card",
    categorySlug: "gas",
    rewardPct:    0.02,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "2% Daily Cash when you use Apple Card with Apple Pay at gas stations",
  },

  // ── Built Card ───────────────────────────────────────────────────────────────
  // 3% at gas stations, home improvement
  {
    cardKey:      "Built|Built Card",
    categorySlug: "gas",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% cash back at gas stations and EV charging",
  },
  {
    cardKey:      "Built|Built Card",
    storeSlug:    "home-depot",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% cash back at home improvement stores",
  },
  // Amex BCP at Exxon, Chevron, BP (category-wide gas already covers; add store-specific for clarity)
  {
    cardKey:      "American Express|Blue Cash Preferred",
    storeSlug:    "exxon",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% cash back at U.S. gas stations",
  },
  {
    cardKey:      "American Express|Blue Cash Preferred",
    storeSlug:    "chevron",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% cash back at U.S. gas stations",
  },
  {
    cardKey:      "American Express|Blue Cash Preferred",
    storeSlug:    "bp",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% cash back at U.S. gas stations",
  },
  {
    cardKey:      "American Express|Blue Cash Preferred",
    storeSlug:    "mobil",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% cash back at U.S. gas stations",
  },
  {
    cardKey:      "Goldman Sachs|Apple Card",
    storeSlug:    "mobil",
    rewardPct:    0.03,
    rewardType:   RewardType.CASHBACK,
    bonusDescription: "3% Daily Cash at Exxon and select gas stations (Apple Pay)",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding CardWise database...\n");

  // 1. Categories
  console.log("📂 Seeding categories...");
  const categoryMap = new Map<string, string>(); // slug → id

  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap.set(cat.slug, created.id);
    console.log(`   ✓ ${cat.name}`);
  }

  // 2. Cards
  console.log("\n💳 Seeding cards...");
  const cardMap = new Map<string, string>(); // "issuer|cardName" → id

  for (const card of cardData) {
    const created = await prisma.card.upsert({
      where: { id: (await prisma.card.findFirst({ where: { issuer: card.issuer, cardName: card.cardName } }))?.id ?? "new" },
      update: {},
      create: {
        issuer:        card.issuer,
        cardName:      card.cardName,
        network:       card.network,
        annualFee:     card.annualFee,
        rewardType:    card.rewardType,
        baseRewardPct: card.baseRewardPct,
        imageUrl:      card.imageUrl,
      },
    });
    cardMap.set(`${card.issuer}|${card.cardName}`, created.id);
    console.log(`   ✓ ${card.issuer} ${card.cardName}`);
  }

  // 3. Stores
  console.log("\n🏪 Seeding stores...");
  const storeMap = new Map<string, string>(); // slug → id

  for (const store of storeData) {
    const categoryId = categoryMap.get(store.categorySlug);
    if (!categoryId) throw new Error(`Category not found: ${store.categorySlug}`);

    const created = await prisma.store.upsert({
      where: { slug: store.slug },
      update: { name: store.name, categoryId, websiteDomain: store.websiteDomain, merchantMcc: store.merchantMcc },
      create: {
        name:          store.name,
        slug:          store.slug,
        categoryId,
        websiteDomain: store.websiteDomain,
        merchantMcc:   store.merchantMcc,
      },
    });
    storeMap.set(store.slug, created.id);
    console.log(`   ✓ ${store.name}`);
  }

  // 4. Offers (skip if offer already exists — idempotent for re-runs)
  console.log("\n🎁 Seeding offers...");
  let offerCount = 0;

  for (const offer of offerData) {
    const cardId = cardMap.get(offer.cardKey);
    if (!cardId) throw new Error(`Card not found: ${offer.cardKey}`);

    const storeId    = offer.storeSlug    ? storeMap.get(offer.storeSlug)       : undefined;
    const categoryId = offer.categorySlug ? categoryMap.get(offer.categorySlug) : undefined;

    if (offer.storeSlug && !storeId)       throw new Error(`Store not found: ${offer.storeSlug}`);
    if (offer.categorySlug && !categoryId) throw new Error(`Category not found: ${offer.categorySlug}`);
    if (!storeId && !categoryId)           throw new Error(`Offer must have storeId or categoryId: ${offer.cardKey}`);

    const existing = await prisma.offer.findFirst({
      where: {
        cardId,
        storeId:    storeId    ?? null,
        categoryId: categoryId ?? null,
        rewardPct:  offer.rewardPct,
      },
    });
    if (existing) continue;

    await prisma.offer.create({
      data: {
        cardId,
        storeId:          storeId    ?? null,
        categoryId:       categoryId ?? null,
        rewardPct:        offer.rewardPct,
        rewardType:       offer.rewardType,
        capAmount:        offer.capAmount    ?? null,
        capPeriod:        offer.capPeriod    ?? null,
        bonusDescription: offer.bonusDescription ?? null,
        dataSource:       DataSource.MANUAL,
      },
    });
    offerCount++;
  }

  console.log(`   ✓ ${offerCount} offers created`);

  console.log(`\n✅ Seed complete!`);
  console.log(`   ${categoryData.length} categories`);
  console.log(`   ${cardData.length} cards`);
  console.log(`   ${storeData.length} stores`);
  console.log(`   ${offerCount} offers`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
