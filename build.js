const option = {
    entryPoints: ["./src/index.js"],
    outdir: "./dist",
    target: "node",
    sourcemap: "linked",
    minify: true,
    drop: ["console"],
};

(async () => {
    await Bun.build({
        format: "esm",
        naming: "index.mjs",
        ...option,
    }).catch(() => process.exit(1));

    await Bun.build({
        format: "cjs",
        naming: "index.cjs",
        ...option,
    }).catch(() => process.exit(1));
})();
