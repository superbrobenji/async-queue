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
        ...option,
    }).catch(() => process.exit(1));

    await Bun.build({
        format: "cjs",
        naming: "cjs.js",
        ...option,
    }).catch(() => process.exit(1));
})();
