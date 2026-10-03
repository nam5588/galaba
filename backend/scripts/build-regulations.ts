// data/regulations/*.txt → data/regulations.json (PRD 6.3). 규정 txt를 추가·수정하면 다시 실행한다.
//   npm --prefix backend run build:rag
import { writeFileSync } from "node:fs";
import { chunkSources, INDEX_FILE } from "../src/rag/regulations.js";

const chunks = chunkSources();
writeFileSync(INDEX_FILE, `${JSON.stringify(chunks, null, 1)}\n`);
const docs = [...new Set(chunks.map((c) => c.doc))];
console.log(`${chunks.length}개 청크 (${docs.join(", ")}) → ${INDEX_FILE}`);
