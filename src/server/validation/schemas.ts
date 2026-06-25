// Zod validation schemas — the single source of truth for all user input.
// Replaces Laravel Form Request classes; used by Server Actions and forms.

import { z } from "zod";
import {
  BUSINESS_TYPES,
  STUDY_AREA_LGAS,
} from "@/server/lib/constants";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol");

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name").max(150),
    email: z.string().email("Enter a valid email address").max(150),
    phone: z.string().min(7, "Enter a valid phone number").max(30),
    userType: z.enum(["farmer", "buyer"]),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email().max(150),
  password: z.string().min(1),
});

export const farmerProfileSchema = z.object({
  lga: z.enum(STUDY_AREA_LGAS),
  ward: z.string().max(100).optional().or(z.literal("")),
  farmSizeHectares: z.coerce.number().min(0).max(999).optional(),
  primaryCommodities: z.string().max(255).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(100).optional(),
});

export const buyerProfileSchema = z.object({
  businessName: z.string().min(2).max(150),
  businessType: z.enum(BUSINESS_TYPES),
  deliveryAddress: z.string().max(500).optional().or(z.literal("")),
  preferredCommodities: z.string().max(255).optional().or(z.literal("")),
});

export const listingSchema = z.object({
  commodityName: z.string().min(2, "Enter the commodity name").max(150),
  categoryId: z.coerce.number().int().positive("Choose a category"),
  quantityAvailableKg: z.coerce.number().positive("Quantity must be greater than 0"),
  askingPricePerKg: z.coerce.number().positive("Price must be greater than 0"),
  qualityDescription: z.string().max(1000).optional().or(z.literal("")),
  harvestDate: z.string().optional().or(z.literal("")),
  availableFrom: z.string().optional().or(z.literal("")),
  imageUrls: z.array(z.string()).optional(),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.coerce.number().int().optional(),
  minQuantity: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  lga: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const messageSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  recipientId: z.coerce.number().int().positive(),
  messageBody: z.string().min(1, "Type a message").max(2000),
});

export const transactionSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  buyerId: z.coerce.number().int().positive(),
  quantityAgreedKg: z.coerce.number().positive("Quantity must be greater than 0"),
  agreedPricePerKg: z.coerce.number().positive("Price must be greater than 0"),
  paymentMethod: z.string().max(50).optional().or(z.literal("")),
});

export const ratingSchema = z.object({
  transactionId: z.coerce.number().int().positive(),
  ratingScore: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().max(1000).optional().or(z.literal("")),
});


export const resetRequestSchema = z.object({
  email: z.string().email().max(150),
});

export const resetSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
