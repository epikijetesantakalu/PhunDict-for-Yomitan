import fs from "fs";
import JSZip from "jszip";

const phunDictURL = "https://kaeru2193.github.io/Phun-Resources/dict/phun-dict.json";

async function getPhunDictData() {
    try {
    const response = await fetch(phunDictURL);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error.message);
  }
}

const phunDictData = await getPhunDictData();

const terms = phunDictData.data.map((entry, i) => [
    entry.word,
    entry.latinPron,
    "",
    "",
    100000-entry.num || 0,
    parseDefinitions(entry.mean),
    i,
    ""
]);

function parseDefinitions(mean) {
    const result = [];

        for(let i = 0; i < mean.length; i++) {
        const definitionBlock = {
            "type": "structured-content",
            "content": {
                "tag": "div",
                "data": { "field": "container" },
                "content": []
            }
        };

        definitionBlock.content.content.push({
            "tag": "div",
            "data": { "field": "type" },
            "content": mean[i].type
        });

        for (let j = 0; j < mean[i].explanation.length; j++) {
            const exp = mean[i].explanation[j];

            definitionBlock.content.content.push({
                "tag": "div",
                "data": { "field": "translation" },
                "content": j+1 + ". " + exp.translate
            });

            if (exp.meaning) {
                definitionBlock.content.content.push({
                    "tag": "div",
                    "data": { "field": "meaning" },
                    "content": exp.meaning
                });
            }
        }
        
        result.push(definitionBlock);
    }
    return result;
}

const maxFileSize = 10000;
const zip = new JSZip();

const metaData = {
    "title": "PhunDict",
    "format": 3,
    "revision": "2026",
    "author": "kaeru2193",
    "description": "A dictionary for the Phun language."
}

const css = `
[data-sc-field="type"] {
    font-size: 1.0em;
}

[data-sc-field="translation"] {
    font-size: 1.5em;
}

[data-sc-field="meaning"] {
    font-size: 1.0em;
}`;

for (let i = 0; i < terms.length; i += maxFileSize) {
  const chunk = terms.slice(i, i + maxFileSize);
  zip.file(`term_bank_${Math.floor(i / maxFileSize) + 1}.json`, JSON.stringify(chunk));
}

zip.file("index.json", JSON.stringify(metaData));
zip.file("styles.css", css);

const buffer = await zip.generateAsync({ type: "nodebuffer" });
fs.writeFileSync("phun-yomitan.zip", buffer);
console.log("成功 :3");