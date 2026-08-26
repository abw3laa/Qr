import { mkdir, writeFile } from "node:fs/promises";

const cacheDir = "node_modules/react-native-css-interop/.cache";
await mkdir(cacheDir, { recursive: true });
await writeFile(`${cacheDir}/web.css`, "/* generated cache marker */\n", "utf8");
console.log(`Prepared ${cacheDir}/web.css`);
