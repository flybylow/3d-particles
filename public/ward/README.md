# Lab 1: RDF Data Modeling and Processing

## Installation

1. Ensure you have Node.js (v18 or higher) installed
2. Run `npm install` to install dependencies

## Execution

1. Run `npm start` to execute the program
2. The program will ingest both `data.ttl` and `data.jsonld` into a single RDF store, output all triples, and display the total count

## Analysis Question 1

JSON-LD is fully compatible with existing JSON tooling and web infrastructure. Any web developer can read, produce, and consume JSON-LD without learning a new syntax. It can be embedded directly in HTML for search engine discovery. This makes JSON-LD ideal when building web APIs or when RDF data needs to be exchanged with systems that already work with JSON, such as REST APIs.

Turtle has the advantage of being more compact and human-readable for directly authoring and inspecting RDF data. Its prefix system and shortcuts allow complex graph structures, making it easier to spot errors or understand relationships. Turtle is best suited for manual RDF authoring, ontology development, or any situation where a domain expert needs to read and write RDF data directly.

## Analysis Question 2

The triple count of 10 is correct even though we ingested 20 quads total (10 from each file). Since both files contain semantically identical content, the duplicate triples are merged, resulting in a count equal to the number of unique triples.
