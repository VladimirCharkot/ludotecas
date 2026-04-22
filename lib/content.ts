import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeExternalLinks from "rehype-external-links"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeStringify from "rehype-stringify"

const CONTENT_ROOT = path.join(process.cwd(), "content")

// --- Types ---

type Collection = "ludoteca" | "experiencias"

export interface BaseMeta {
  titulo: string
  descripcion: string
  imagen?: string
  tags?: string[]
}

export interface JuegoMeta extends BaseMeta {
  fuentes?: string[]
  oculto?: boolean
}

export interface ExperienciaMeta extends BaseMeta {
  region?: string
  direccion?: string
  horarios?: string
  contacto?: string
}

export interface ContentItem<T extends BaseMeta = BaseMeta> {
  slug: string
  meta: T
  rawContent: string
}

export interface RenderedItem<T extends BaseMeta = BaseMeta>
  extends ContentItem<T> {
  html: string
}

// --- Filesystem helpers ---

function contentDir(collection: Collection) {
  return path.join(CONTENT_ROOT, collection)
}

function slugFrom(filename: string) {
  return path.basename(filename, ".md")
}

// --- Loaders ---

export function getAllContent<T extends BaseMeta = BaseMeta>(
  collection: Collection
): ContentItem<T>[] {
  const dir = contentDir(collection)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), "utf-8")
      const { data, content } = matter(raw)
      return {
        slug: slugFrom(filename),
        meta: data as T,
        rawContent: content,
      }
    })
}

export function getBySlug<T extends BaseMeta = BaseMeta>(
  collection: Collection,
  slug: string
): ContentItem<T> | null {
  const filepath = path.join(contentDir(collection), `${slug}.md`)
  if (!fs.existsSync(filepath)) return null

  const raw = fs.readFileSync(filepath, "utf-8")
  const { data, content } = matter(raw)
  return { slug, meta: data as T, rawContent: content }
}

// --- Querying ---

type MetaFilter<T> = {
  [K in keyof T]?: T[K] extends (infer U)[] ? U | U[] : T[K]
}

export function queryByMeta<T extends BaseMeta = BaseMeta>(
  collection: Collection,
  filters: MetaFilter<T>
): ContentItem<T>[] {
  return getAllContent<T>(collection).filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      const field = (item.meta as Record<string, unknown>)[key]

      // Array field (e.g. tags): match if any filter value is present
      if (Array.isArray(field)) {
        const values = Array.isArray(value) ? value : [value]
        return values.some((v) => field.includes(v))
      }

      return field === value
    })
  )
}

// --- Rendering ---

// Le pasamos un schema personalizado a rehype-sanitize para permitir iframes con ciertos atributos (ej. para videos de YouTube)
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "iframe"],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    iframe: [
      "src",
      "width",
      "height",
      "title",
      "frameborder",
      "allow",
      "allowfullscreen",
      "referrerpolicy",
    ],
  },
}

export async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(content)

  return String(result)
}

export async function getRenderedBySlug<T extends BaseMeta = BaseMeta>(
  collection: Collection,
  slug: string
): Promise<RenderedItem<T> | null> {
  const item = getBySlug<T>(collection, slug)
  if (!item) return null

  const html = await renderMarkdown(item.rawContent)
  return { ...item, html }
}
