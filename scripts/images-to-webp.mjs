#!/usr/bin/env node
// Convierte todas las imágenes no-WebP en public/images a WebP y elimina los originales.
// Uso: node scripts/images-to-webp.mjs [carpeta]

import { readdir, unlink } from "fs/promises"
import { join, extname, basename } from "path"
import sharp from "sharp"

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".gif", ".tiff", ".avif"])
const folder = process.argv[2] ?? "public/images"

async function processDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await processDir(fullPath)
      continue
    }
    const ext = extname(entry.name).toLowerCase()
    if (!SUPPORTED.has(ext)) continue

    const outPath = join(dir, basename(entry.name, ext) + ".webp")
    await sharp(fullPath).webp({ quality: 85 }).toFile(outPath)
    await unlink(fullPath)
    console.log(`✓ ${fullPath} → ${outPath}`)
  }
}

processDir(folder).catch((err) => {
  console.error(err.message)
  process.exit(1)
})
