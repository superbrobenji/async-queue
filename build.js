import { build } from "esbuild";
import { dtsPlugin } from "esbuild-plugin-d.ts";

const option = {
    bundle: true,
    color: true,
    logLevel: "info",
    sourcemap: true,
    entryPoints: ["./src/index.js"],
    minify: true,
};
(async () => {
    await build({
        format: "esm",
        outdir: "dist",
        splitting: true,
        plugins: [dtsPlugin()],
        ...option,
    }).catch(() => process.exit(1));

    await build({
        format: "cjs",
        outfile: "./dist/cjs.js",
        ...option,
    }).catch(() => process.exit(1));
})();
