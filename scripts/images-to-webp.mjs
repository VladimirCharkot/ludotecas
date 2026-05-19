#!/usr/bin/env node
// Convierte todas las imágenes no-WebP en public/images a WebP y elimina los originales.
// Uso: node scripts/images-to-webp.mjs [carpeta]

import { readdir, unlink } from "fs/promises"
import { join, extname, basename } from "path"
import { execFile } from "child_process"
import { tmpdir } from "os"
import sharp from "sharp"

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".gif", ".tiff", ".avif", ".heic"])
const folder = process.argv[2] ?? "public/images"

function sipsToPng(src, dest) {
  return new Promise((resolve, reject) =>
    execFile("sips", ["-s", "format", "png", src, "--out", dest], (err) =>
      err ? reject(err) : resolve()
    )
  )
}

async function processDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await processDir(fullPath)
      continue
    }
    const ext = extname(entry.name)
    const extLower = ext.toLowerCase()
    if (!SUPPORTED.has(extLower)) continue

    const outPath = join(dir, basename(entry.name, ext) + ".webp")

    let inputPath = fullPath
    let tmpFile = null
    if (extLower === ".heic") {
      tmpFile = join(tmpdir(), `${basename(entry.name, ext)}-${Date.now()}.png`)
      await sipsToPng(fullPath, tmpFile)
      inputPath = tmpFile
    }

    await sharp(inputPath).rotate().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 75 }).toFile(outPath)
    if (tmpFile) await unlink(tmpFile)
    await unlink(fullPath)
    console.log(`✓ ${fullPath} → ${outPath}`)
  }
}

processDir(folder).catch((err) => {
  console.error(err.message)
  process.exit(1)
})
