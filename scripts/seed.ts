// Seed script — populates the database with commodity categories, a 30-day
// market-price history, demo users (admin, farmers, buyers), produce listings,
// and a sample message/transaction/rating so every dashboard has content.
//
// Run with:  pnpm db:seed   (after pnpm db:migrate)
// Demo login password for ALL seeded accounts:  Password123!

import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import bcrypt from "bcryptjs";
import * as schema from "../src/server/db/schema";
import {
  COMMODITY_CATEGORIES,
  LAGOS_MARKETS,
} from "../src/server/lib/constants";

function isRemotePostgres(url: string | undefined): url is string {
  return !!url && /^postgres(ql)?:\/\//.test(url);
}

async function buildDb() {
  const url = process.env.DATABASE_URL;
  if (isRemotePostgres(url)) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return { db: drizzle(neon(url), { schema }), close: async () => {} };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite(process.env.PGLITE_DIR ?? "./.pglite");
  return { db: drizzle(client, { schema }), close: async () => client.close() };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const { db, close } = await buildDb();

  // Clean existing rows (idempotent reseed). Order respects FKs.
  for (const t of [
    schema.userRatings,
    schema.transactions,
    schema.messages,
    schema.systemNotifications,
    schema.produceListings,
    schema.marketPrices,
    schema.commodityCategories,
    schema.farmerProfiles,
    schema.buyerProfiles,
    schema.users,
  ]) {
    await db.delete(t);
  }

  // ── Commodity categories ────────────────────────────────────────────────
  const categoryRows = await db
    .insert(schema.commodityCategories)
    .values(COMMODITY_CATEGORIES.map((c) => ({ categoryName: c })))
    .returning();
  const catId = (name: string) =>
    categoryRows.find((c) => c.categoryName === name)!.id;

  // ── Market prices: 30-day history for key commodities × 3 markets ────────
  const priceCommodities: Array<{ name: string; base: number }> = [
    { name: "Tomatoes", base: 1200 },
    { name: "Pepper (Rodo)", base: 2500 },
    { name: "Waterleaf", base: 600 },
    { name: "Pumpkin Leaves (Ugwu)", base: 800 },
  ];
  const priceValues = [];
  for (const { name, base } of priceCommodities) {
    for (let market = 0; market < LAGOS_MARKETS.length; market++) {
      for (let d = 29; d >= 0; d--) {
        const wobble = Math.sin(d / 4 + market) * base * 0.12;
        const marketBump = market * base * 0.05;
        const low = Math.round(base + marketBump + wobble - base * 0.08);
        const high = Math.round(low + base * 0.18);
        priceValues.push({
          commodityName: name,
          marketName: LAGOS_MARKETS[market],
          pricePerKgLow: String(low),
          pricePerKgHigh: String(high),
          recordedDate: daysAgo(d),
          dataSource: "LSADA market survey",
        });
      }
    }
  }
  await db.insert(schema.marketPrices).values(priceValues);

  // ── Users ────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("Password123!", 10);
  const mk = (
    fullName: string,
    email: string,
    phone: string,
    userType: "farmer" | "buyer" | "admin",
  ) => ({
    fullName,
    email,
    phone,
    passwordHash: hash,
    userType,
    isVerified: true,
  });

  const userRows = await db
    .insert(schema.users)
    .values([
      mk("Platform Administrator", "admin@farmlink.ng", "08000000000", "admin"),
      mk("Adaeze Okafor", "adaeze@imota.ng", "08030000001", "farmer"),
      mk("Emeka Nwosu", "emeka@ikorodu.ng", "08030000002", "farmer"),
      mk("Funke Adeyemi", "funke@ijede.ng", "08030000003", "farmer"),
      mk("Mile 12 Fresh Produce Ltd", "buyer@mile12.ng", "08040000001", "buyer"),
      mk("Mama Nkechi Kitchen", "kitchen@lagos.ng", "08040000002", "buyer"),
    ])
    .returning();

  const byEmail = (e: string) => userRows.find((u) => u.email === e)!;
  const adaeze = byEmail("adaeze@imota.ng");
  const emeka = byEmail("emeka@ikorodu.ng");
  const funke = byEmail("funke@ijede.ng");
  const buyerWholesale = byEmail("buyer@mile12.ng");
  const buyerRestaurant = byEmail("kitchen@lagos.ng");

  await db.insert(schema.farmerProfiles).values([
    {
      userId: adaeze.id,
      lga: "Imota",
      ward: "Imota Central",
      farmSizeHectares: "1.50",
      primaryCommodities: "Waterleaf, Pumpkin Leaves, Tomatoes",
      yearsExperience: 9,
    },
    {
      userId: emeka.id,
      lga: "Ikorodu",
      ward: "Igbogbo",
      farmSizeHectares: "2.00",
      primaryCommodities: "Pepper, Cassava, Maize",
      yearsExperience: 14,
    },
    {
      userId: funke.id,
      lga: "Ijede",
      ward: "Ijede Town",
      farmSizeHectares: "0.80",
      primaryCommodities: "Catfish, Tomatoes",
      yearsExperience: 5,
    },
  ]);

  await db.insert(schema.buyerProfiles).values([
    {
      userId: buyerWholesale.id,
      businessName: "Mile 12 Fresh Produce Ltd",
      businessType: "wholesaler",
      deliveryAddress: "Mile 12 Market, Kosofe, Lagos",
      preferredCommodities: "Tomatoes, Pepper, Vegetables",
    },
    {
      userId: buyerRestaurant.id,
      businessName: "Mama Nkechi Kitchen",
      businessType: "restaurant",
      deliveryAddress: "Ikeja GRA, Lagos",
      preferredCommodities: "Vegetables, Catfish",
    },
  ]);

  // ── Produce listings ──────────────────────────────────────────────────────
  const listingRows = await db
    .insert(schema.produceListings)
    .values([
      {
        farmerId: adaeze.id,
        categoryId: catId("Fresh Vegetables"),
        commodityName: "Fresh Waterleaf",
        quantityAvailableKg: "120.00",
        askingPricePerKg: "650.00",
        qualityGrade: "Grade A",
        qualityDescription: "Freshly harvested this morning, tender leaves.",
        harvestDate: daysAgo(1),
        availableFrom: daysAgo(0),
        listingStatus: "active",
        imageUrls: [
          "https://1nhwui9djw92y5u3.public.blob.vercel-storage.com/listings/fresh-waterleaf-1.jpg",
        ],
      },
      {
        farmerId: emeka.id,
        categoryId: catId("Fresh Vegetables"),
        commodityName: "Rodo Pepper",
        quantityAvailableKg: "200.00",
        askingPricePerKg: "2400.00",
        qualityGrade: "Grade B",
        qualityDescription: "Bulk supply, good colour.",
        harvestDate: daysAgo(2),
        availableFrom: daysAgo(0),
        listingStatus: "active",
        imageUrls: [
          "https://1nhwui9djw92y5u3.public.blob.vercel-storage.com/listings/rodo-pepper-3.jpg",
          "https://1nhwui9djw92y5u3.public.blob.vercel-storage.com/listings/rodo-pepper-4.jpg",
        ],
      },
      {
        farmerId: emeka.id,
        categoryId: catId("Root Crops and Tubers"),
        commodityName: "Yam Tubers",
        quantityAvailableKg: "500.00",
        askingPricePerKg: "850.00",
        qualityGrade: "Grade A",
        qualityDescription: "Freshly harvested Puna yam tubers, firm and well-cured. Sold per kg or by the tuber.",
        harvestDate: daysAgo(3),
        availableFrom: daysAgo(0),
        listingStatus: "active",
        imageUrls: [
          "https://1nhwui9djw92y5u3.public.blob.vercel-storage.com/listings/yam-tubers-1.jpg",
          "https://1nhwui9djw92y5u3.public.blob.vercel-storage.com/listings/yam-tubers-2.jpg",
        ],
      },
      {
        farmerId: funke.id,
        categoryId: catId("Fish and Seafood"),
        commodityName: "Live Catfish",
        quantityAvailableKg: "60.00",
        askingPricePerKg: "1900.00",
        qualityGrade: "Grade A",
        qualityDescription: "Pond-fresh, average 1.2kg each.",
        harvestDate: daysAgo(0),
        availableFrom: daysAgo(0),
        listingStatus: "active",
        imageUrls: [
          "https://1nhwui9djw92y5u3.public.blob.vercel-storage.com/listings/catfish-market-1.jpg",
        ],
      },
      {
        farmerId: funke.id,
        categoryId: catId("Fresh Vegetables"),
        commodityName: "Roma Tomatoes",
        quantityAvailableKg: "150.00",
        askingPricePerKg: "1150.00",
        qualityGrade: "Grade B",
        harvestDate: daysAgo(2),
        availableFrom: daysAgo(0),
        listingStatus: "active",
        imageUrls: [
          "https://1nhwui9djw92y5u3.public.blob.vercel-storage.com/listings/roma-tomatoes-1.jpg",
          "https://1nhwui9djw92y5u3.public.blob.vercel-storage.com/listings/roma-tomatoes-2.jpg",
        ],
      },
    ])
    .returning();

  // ── A sample message thread (buyer → farmer) ──────────────────────────────
  const waterleaf = listingRows[0];
  await db.insert(schema.messages).values([
    {
      listingId: waterleaf.id,
      senderId: buyerRestaurant.id,
      recipientId: adaeze.id,
      messageBody: "Good morning, is the waterleaf still available? I need 50kg.",
      isRead: true,
      readAt: new Date(),
    },
    {
      listingId: waterleaf.id,
      senderId: adaeze.id,
      recipientId: buyerRestaurant.id,
      messageBody: "Yes it is. I can supply 50kg today at ₦650/kg.",
      isRead: false,
    },
  ]);

  // ── A completed transaction + rating (populates credibility score) ────────
  const tomatoes = listingRows[4];
  const txnRows = await db
    .insert(schema.transactions)
    .values({
      listingId: tomatoes.id,
      buyerId: buyerWholesale.id,
      farmerId: funke.id,
      quantityAgreedKg: "100.00",
      agreedPricePerKg: "1150.00",
      totalValue: "115000.00",
      paymentMethod: "Bank transfer",
      transactionStatus: "completed",
      confirmedAt: new Date(),
      completedAt: new Date(),
    })
    .returning();

  await db.insert(schema.userRatings).values({
    transactionId: txnRows[0].id,
    raterId: buyerWholesale.id,
    rateeId: funke.id,
    ratingScore: 5,
    reviewText: "Excellent quality tomatoes, delivered on time. Highly recommended.",
  });

  await db.insert(schema.systemNotifications).values([
    {
      userId: adaeze.id,
      notificationType: "message",
      notificationMessage: "Mama Nkechi Kitchen sent an enquiry about your Fresh Waterleaf listing.",
      relatedEntityId: waterleaf.id,
    },
    {
      userId: funke.id,
      notificationType: "rating",
      notificationMessage: "You received a 5-star rating from Mile 12 Fresh Produce Ltd.",
      relatedEntityId: txnRows[0].id,
    },
  ]);

  await close();
  console.log("✓ Database seeded.");
  console.log("  Demo accounts (password: Password123!):");
  console.log("    admin@farmlink.ng        (admin)");
  console.log("    adaeze@imota.ng          (farmer)");
  console.log("    buyer@mile12.ng          (buyer)");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
