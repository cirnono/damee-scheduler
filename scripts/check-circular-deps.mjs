import fs from "node:fs";
import madge from "madge";

const candidateRoots = ["app", "components", "features", "lib", "server"];

const roots = candidateRoots.filter((path) => fs.existsSync(path));

if (roots.length === 0) {
    console.log("No source directories found. Skipping circular dependency check.");
    process.exit(0);
}

const result = await madge(roots, {
    baseDir: ".",
    tsConfig: "./tsconfig.json",
    fileExtensions: ["ts", "tsx", "js", "jsx"],
    excludeRegExp: [
        /node_modules/,
        /\.next/,
        /coverage/,
        /dist/,
        /out/,
        /\.turbo/,
        /__tests__/,
        /\.test\./,
        /\.spec\./
    ],
    detectiveOptions: {
        ts: {
            skipTypeImports: true
        },
        tsx: {
            skipTypeImports: true
        }
    }
});

const circular = result.circular();

if (circular.length > 0) {
    console.error("\nCircular dependencies found:\n");

    for (const cycle of circular) {
        console.error(`- ${cycle.join(" -> ")}`);
    }

    console.error("\nFix these cycles before merging.\n");
    process.exit(1);
}

console.log("No circular dependencies found.");