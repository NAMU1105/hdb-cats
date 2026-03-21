import { build } from 'esbuild'
import { readdirSync } from 'fs'
import { join } from 'path'

const handlersDir = join(process.cwd(), 'src', 'handlers')
const handlers = readdirSync(handlersDir).filter((f) => f.endsWith('.ts'))

await Promise.all(
  handlers.map((file) => {
    const name = file.replace('.ts', '')
    return build({
      entryPoints: [join(handlersDir, file)],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'cjs',
      outfile: join(process.cwd(), 'dist', name, 'index.js'),
      minify: true,
      sourcemap: false,
      external: [], // bundle all deps including AWS SDK v3 for version consistency
    })
  }),
)

console.log(`Built ${handlers.length} Lambda handlers.`)
