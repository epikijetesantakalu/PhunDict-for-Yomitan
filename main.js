import { Dictionary, DictionaryIndex, TermEntry } from 'yomichan-dict-builder';
import { execSync } from 'child_process';

const sourceDictURL = "https://kaeru2193.github.io/Phun-Resources/dict/phun-dict.json";

async function getDictData() {
    try {
        const response = await fetch(sourceDictURL);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error(error.message);
    }
}

const dictData = await getDictData();

const dictionary = new Dictionary({
    fileName: "PhunDict.zip"
});

const index = new DictionaryIndex()
.setTitle("PhunDict")
.setRevision(dictData.date)
.setAuthor(dictData.author)
.setDescription("かえるさんの雰和辞典をyomitan形式に変換したもの")
.setAttribution("CC BY-NC 4.0")
.setUrl("https://github.com/epikijetesantakalu/PhunDict-for-Yomitan")
.setIndexUrl("https://github.com/epikijetesantakalu/PhunDict-for-Yomitan/releases/latest/download/index.json")
.setDownloadUrl("https://github.com/epikijetesantakalu/PhunDict-for-Yomitan/releases/latest/download/PhunDict.zip")
.setIsUpdatable(true)
.build();

await dictionary.setIndex(index, "./dictionary", "index.json");

for (let i = 0; i < dictData.data.length; i++) {
    for (let j = 0; j < dictData.data[i].mean.length; j++) {
        for (let k = 0; k < dictData.data[i].mean[j].explanation.length; k++) {
            const detailedDefinition = {
                type: "structured-content",
                content: {
                    tag: "div",
                    content: [
                        { tag: "span", content: dictData.data[i].mean[j].type, data: { partOfSpeech: dictData.data[i].mean[j].type } },
                        { tag: "span", content: dictData.data[i].mean[j].explanation[k].translate },
                        { tag: "div", content: dictData.data[i].mean[j].explanation[k].meaning, data: { longExplanation: "true" } }
                    ]
                }
            }
            
            const entry = new TermEntry(dictData.data[i].word)
            .setReading(dictData.data[i].pron.split(" ").join(""))
            .addDetailedDefinition(detailedDefinition)
            .build();

            await dictionary.addTerm(entry);
        }
    }
    //generateAudioFile(dictData.data[i].pron.split(" ").join(""));
}

function generateAudioFile(pronunciation) {
    execSync(`espeak-ng -vphn ${pronunciation} -w ../phun-audios/wav/${pronunciation}.wav`);
    execSync(`ffmpeg -i ../phun-audios/wav/${pronunciation}.wav ../phun-audios/mp3/${pronunciation}.mp3 -y`);
}

await dictionary.addFile('./styles.css', 'styles.css');

await dictionary.export("./dictionary");