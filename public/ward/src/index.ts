import { RdfStore } from "rdf-stores";
import { DataFactory } from "rdf-data-factory";
import { Parser as N3Parser } from "n3";
import jsonld from "jsonld";
import { readFileSync } from "fs";

const DF = new DataFactory();

async function parseTurtle(filePath: string): Promise<ReturnType<typeof DF.quad>[]> {
  const data = readFileSync(filePath, "utf-8");
  const parser = new N3Parser();
  return parser.parse(data);
}

async function parseJsonLd(filePath: string): Promise<ReturnType<typeof DF.quad>[]> {
  const data = readFileSync(filePath, "utf-8");
  const doc = JSON.parse(data);

  // Convert JSON-LD to N-Quads string, then parse with N3
  const nquads = (await jsonld.toRDF(doc, { format: "application/n-quads" })) as string;
  const parser = new N3Parser({ format: "N-Quads" });
  return parser.parse(nquads);
}

async function main() {
  try {
    const store = RdfStore.createDefault();

    // 1. Ingest Turtle file
    const turtleQuads = await parseTurtle("data.ttl");
    for (const quad of turtleQuads) {
      store.addQuad(quad);
    }
    console.log(`Ingested ${turtleQuads.length} quads from data.ttl`);

    // 2. Ingest JSON-LD file
    const jsonldQuads = await parseJsonLd("data.jsonld");
    for (const quad of jsonldQuads) {
      store.addQuad(quad);
    }
    console.log(`Ingested ${jsonldQuads.length} quads from data.jsonld`);

    // 3. Output all triples
    console.log("\n--- All triples in the store ---");
    const allQuads = store.getQuads(undefined, undefined, undefined, undefined);
    for (const quad of allQuads) {
      const subject = quad.subject.value;
      const predicate = quad.predicate.value;
      const object = quad.object.termType === "Literal"
        ? `"${quad.object.value}"`
        : `<${quad.object.value}>`;
      console.log(`<${subject}> <${predicate}> ${object} .`);
    }

    // 4. Count triples
    console.log(`\nTotal triples in store: ${store.size}`);
  } catch (error) {
    console.error("An error occurred:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
