import { replaceEntities, secondaryReplacements } from './dataAnonymization.js';
import { displayResults } from './dataSynthesis.js';
import { pipe } from './index.js';

// Función para ejecutar el modelo NER
async function runNER(inputText, mode, filename = '') {
    const resultDiv = document.getElementById('result');
    resultDiv.classList.remove('hidden');

    if (!inputText) {
        resultDiv.textContent = 'Por favor, ingrese algún texto.';
        return;
    }

    const loadingLabel = document.createElement('p');
    loadingLabel.id = `file-${filename}`;
    loadingLabel.textContent = `Analizando ${filename}...`;
    resultDiv.appendChild(loadingLabel);

    try {
        const segments = splitText(inputText);
        let cleanedEntities = [];
        let replacedTextLines = [];
        for (const segment of segments) {
            const entities = await pipe(segment);
            const cleanedSegmentEntities = cleanEntities(entities);
            const filteredEntities = filterEntities(cleanedSegmentEntities);
            cleanedEntities = cleanedEntities.concat(filteredEntities);
            replacedTextLines.push(replaceEntities(segment, filteredEntities, mode));
        }
        let replacedText = replacedTextLines.join('\n');
        replacedText = secondaryReplacements(replacedText, mode);
        
        loadingLabel.remove(); // Remove the loading message
        await displayResults(inputText, replacedText, filename);
        // If only one file is processed, enable the single file download
        if (filename && document.getElementById('file-input').files.length === 1) {
            document.getElementById('downloadSingleBtn').style.display = 'block';
            document.getElementById('downloadZipBtn').style.display = 'none';
        } else {
            document.getElementById('downloadZipBtn').style.display = 'block';
            document.getElementById('downloadSingleBtn').style.display = 'none';
        }
        document.getElementById('clearResultsBtn').classList.remove('hidden');

    } catch (error) {
        resultDiv.innerHTML += `<p>Error al procesar el texto ${filename}: ${error}</p>`;
    }
}

// Función para separar el texto por saltos de línea
function splitText(text) {
    return text.split('\n');
}

// Función para limpiar las entidades y combinar las que tengan un índice consecutivo para formar una sola entidad.
function cleanEntities(entities) {
    const cleanedEntities = [];
    let currentEntity = null;

    entities.forEach((entity) => {
        // Eliminar espacios al principio y al final de la palabra
        entity.word = entity.word.trim();
        if (currentEntity && entity.index === currentEntity.index + 1) {
            if (entity.word.startsWith('##')) {
                currentEntity.word += entity.word.replace('##', '');
            } else {
                currentEntity.word += entity.word;
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

// Función para filtrar las entidades con una puntuación menor a 0.6
function filterEntities(entities) {
    return entities.filter(entity => entity.score >= 0.6);
}

export { runNER, pipe, splitText, cleanEntities, filterEntities };