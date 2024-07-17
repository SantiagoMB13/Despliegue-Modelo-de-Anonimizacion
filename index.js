import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';
import { fakerES as faker } from "https://esm.sh/@faker-js/faker@v8.4.0";

env.allowLocalModels = false;
const pipe = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');

// Selecciona el botón por su ID
const boton = document.getElementById('runmodelbtn');

document.getElementById('runmodelbtn').addEventListener('click', async () => {
    const inputText = document.getElementById('input-text').value;
    const mode = document.getElementById('anonimization-mode').value;
    if (inputText) {
        await runNER(inputText, mode);
    } else {
        alert('Por favor, ingrese algún texto.');
    }
});

document.getElementById('uploadfilebtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const mode = document.getElementById('anonimization-mode').value;
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const inputText = e.target.result;
            await runNER(inputText, mode);
        };
        reader.readAsText(file);
    } else {
        alert('Por favor, suba un archivo.');
    }
});

document.getElementById('clearResultsBtn').addEventListener('click', () => {
    document.getElementById('result').innerHTML = '';
    document.getElementById('input-text').value = '';
    document.getElementById('file-input').value = '';
});

async function runNER(inputText, mode) {
    const resultDiv = document.getElementById('result');

    if (!inputText) {
        resultDiv.textContent = 'Por favor, ingrese algún texto.';
        return;
    }

    resultDiv.textContent = 'Analizando...';

    try {
        const segments = splitText(inputText);
        let cleanedEntities = [];
        let replacedText = '';
        for (const segment of segments) {
            const entities = await pipe(segment);
            const cleanedSegmentEntities = cleanEntities(entities);
            console.log(cleanedSegmentEntities);
            const filteredEntities = filterEntities(cleanedSegmentEntities);
            cleanedEntities = cleanedEntities.concat(filteredEntities);
            replacedText += " " + replaceEntities(segment, filteredEntities, mode);
        }
        replacedText = replacedText.slice(0, -1);
        displayResults(replacedText, cleanedEntities);
    } catch (error) {
        resultDiv.textContent = 'Error al procesar el texto: ' + error.message;
    }
}

function splitText(text) {
    const sentences = text.split('.');
    const segments = [];
    for (let i = 0; i < sentences.length; i += 2) {
        const segment = sentences.slice(i, i + 2).join('.') + '.';
        segments.push(segment.trim());
    }
    return segments;
}

function cleanEntities(entities) {
    const cleanedEntities = [];
    let currentEntity = null;

    entities.forEach((entity, index) => {
        if (currentEntity && entity.index === currentEntity.index + 1) {
            if (entity.word.startsWith('##')) {
                currentEntity.word += entity.word.replace('##', '');
            } else {
                currentEntity.word += ' ' + entity.word;
            }
            currentEntity.index = entity.index;
        } else {
            if (currentEntity) {
                cleanedEntities.push(currentEntity);
            }
            currentEntity = { ...entity };
        }
    });

    if (currentEntity) {
        cleanedEntities.push(currentEntity);
    }

    return cleanedEntities;
}

function filterEntities(entities) {
    return entities.filter(entity => entity.score >= 0.6);
}

function replaceEntities(text, entities, mode) {
    let replacedText = text;

    entities.forEach(entity => {
        let replacement;

        if (mode === 'advanced') {
            if (entity.entity.includes('PER')) {
                replacement = faker.person.firstName() + ' ' + faker.person.lastName();
            } else if (entity.entity.includes('LOC')) {
                replacement = faker.location.country();
            } else if (entity.entity.includes('ORG')) {
                replacement = faker.company.name();
            } else {
                replacement = entity.entity;
            }
        } else if (mode === 'generic') {
            if (entity.entity.includes('PER')) {
                replacement = '[persona]';
            } else if (entity.entity.includes('LOC')) {
                replacement = '[lugar]';
            } else if (entity.entity.includes('ORG')) {
                replacement = '[organización]';
            } else {
                replacement = entity.entity;
            }
        }

        const regex = new RegExp(`\\b${entity.word}\\b`, 'g');
        replacedText = replacedText.replace(regex, replacement);
    });

    return replacedText;
}

function displayResults(replacedText, entities) {
    const resultDiv = document.getElementById('result');

    let output = `<h2>Texto anonimizado</h2><p>${replacedText}</p>`;
    output += '<h2>Resultados del modelo</h2><ul>';

    entities.forEach(entity => {
        output += `<li><strong>Texto:</strong> ${entity.word}<br>`;
        output += `<strong>Tipo:</strong> ${entity.entity}<br>`;
        output += `<strong>Puntuación:</strong> ${entity.score.toFixed(4)}</li>`;
    });

    output += '</ul>';
    output += '<button id="downloadButton" class="btn btn-primary">Descargar Texto Anonimizado</button>';

    resultDiv.innerHTML = output;

    document.getElementById('downloadButton').addEventListener('click', function() {
        const blob = new Blob([replacedText], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'nota_anonimizada.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
