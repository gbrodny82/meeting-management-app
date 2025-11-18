import { db } from "./db";
import { achievements } from "@shared/schema";
import { ACHIEVEMENT_DEFINITIONS } from "./achievements";
import { eq } from "drizzle-orm";

// Seed achievement definitions into the database
export async function seedAchievements(): Promise<void> {
  console.log("Seeding achievement definitions...");
  
  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    try {
      // Check if achievement already exists
      const existing = await db.select().from(achievements).where(eq(achievements.badgeId, achievement.badgeId));
      
      if (existing.length === 0) {
        await db.insert(achievements).values(achievement);
        console.log(`✅ Added achievement: ${achievement.name}`);
      } else {
        console.log(`⚠️  Achievement already exists: ${achievement.name}`);
      }
    } catch (error) {
      console.error(`❌ Error seeding achievement ${achievement.name}:`, error);
    }
  }
  
  console.log("Achievement seeding completed!");
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAchievements().catch(console.error);
}