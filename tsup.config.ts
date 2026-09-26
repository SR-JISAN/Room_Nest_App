import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "esnext",
  outDir: "dist",
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: `import { createRequire} from  'module';
        const require = createRequire(import.meta.url);
        
        `,
  },
});
