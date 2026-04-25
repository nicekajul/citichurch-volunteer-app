
const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL in .env.local");
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected successfully.");

    console.log("Adding 'icon' column to 'teams' table...");
    await client.query('ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS icon text;');
    console.log("Column 'icon' ensured.");

    console.log("Seeding teams with icons...");
    const seedSql = `
      INSERT INTO public.teams (id, name, description, icon, color) VALUES
        ('11111111-1111-1111-1111-111111111111', 'Broadcast', 'Live streaming and video production team', 'Radio', '#EF4444'),
        ('22222222-2222-2222-2222-222222222222', 'Lights', 'Stage lighting and visual effects team', 'Lightbulb', '#F59E0B'),
        ('33333333-3333-3333-3333-333333333333', 'Media', 'Graphics, slides, and multimedia content team', 'Monitor', '#10B981'),
        ('44444444-4444-4444-4444-444444444444', 'Sounds', 'Audio engineering and sound mixing team', 'Volume2', '#3B82F6'),
        ('55555555-5555-5555-5555-555555555555', 'Stage Design', 'Set design and stage management team', 'Palette', '#8B5CF6'),
        ('66666666-6666-6666-6666-666666666666', 'Cameras', 'Camera operation and video capture team', 'Camera', '#EC4899')
      ON CONFLICT (id) DO UPDATE SET 
        icon = EXCLUDED.icon,
        description = EXCLUDED.description,
        name = EXCLUDED.name,
        color = EXCLUDED.color;
    `;
    await client.query(seedSql);
    console.log("Seed data applied successfully.");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

runMigration();
