import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Create a new object detection pipeline
const pipe = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');

// Selecciona el botón por su ID (supongamos que el ID del botón es "miBoton")
const boton = document.getElementById('runmodelbtn');

// Event listener para el boton de analizar
document.getElementById('runmodelbtn').addEventListener('click', async () => {
    const inputText = document.getElementById('input-text').value;
    if (inputText) {
        await runNER(inputText);
    } else {
        alert('Por favor, ingrese algún texto.');
    }
});

// Añadir event listener para subir y analizar archivo
document.getElementById('uploadfilebtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const inputText = e.target.result;
            await runNER(inputText);
        };
        reader.readAsText(file);
    } else {
        alert('Por favor, suba un archivo.');
    }
});

// Función para ejecutar NER en el texto ingresado
async function runNER(inputText) {
    const resultDiv = document.getElementById('result');

    if (!inputText) {
        resultDiv.textContent = 'Por favor, ingrese algún texto.';
        return;
    }

    resultDiv.textContent = 'Analizando...';

    try {
        // Divide el texto en segmentos de 4 oraciones para mejorar la precisión
        const segments = splitText(inputText);
        let cleanedEntities = [];
        let replacedText = '';
        // Procesa cada segmento y concatena los resultados
        for (const segment of segments) {
            const entities = await pipe(segment);
            const cleanedSegmentEntities = cleanEntities(entities);
            cleanedEntities = cleanedEntities.concat(cleanedSegmentEntities);
            replacedText += " " + replaceEntities(segment, cleanedSegmentEntities);
        }
        // Elimina el último punto que se añade de más en blanco
        replacedText = replacedText.slice(0, -1);
        displayResults(replacedText, cleanedEntities);
    } catch (error) {
        resultDiv.textContent = 'Error al procesar el texto: ' + error.message;
    }
}

// Función para dividir el texto en segmentos de 4 oraciones
function splitText(text) {
    const sentences = text.split('.');
    const segments = [];

    for (let i = 0; i < sentences.length; i += 4) {
        const segment = sentences.slice(i, i + 4).join('.') + '.';
        segments.push(segment.trim());
    }

    return segments;
}

// Función para limpiar las entidades
function cleanEntities(entities) {
    const cleanedEntities = [];
    let currentEntity = null;

    entities.forEach((entity, index) => {
        if (currentEntity && entity.index === currentEntity.index + 1) {
            // Concatena palabras con índices sucesivos
            if (entity.word.startsWith('##')) {
                currentEntity.word += entity.word.replace('##', '');
            } else {
                currentEntity.word += ' ' + entity.word;
            }
            currentEntity.index = entity.index;
        } else {
            // Añade la entidad anterior a cleanedEntities
            if (currentEntity) {
                cleanedEntities.push(currentEntity);
            }
            // Inicializa una nueva entidad
            currentEntity = { ...entity };
        }
    });

    // Añade la última entidad al cleanedEntities
    if (currentEntity) {
        cleanedEntities.push(currentEntity);
    }

    return cleanedEntities;
}

// Función para reemplazar entidades en el texto
function replaceEntities(text, entities) {
    let replacedText = text;

    entities.forEach(entity => {
        const regex = new RegExp(`\\b${entity.word}\\b`, 'g');
        replacedText = replacedText.replace(regex, entity.entity);
    });

    return replacedText;
}

// Función para mostrar los resultados
function displayResults(replacedText, entities) {
    const resultDiv = document.getElementById('result');

    // Crea la salida con subtítulos y listas no ordenadas
    let output = `<h2>Texto anonimizado</h2><p>${replacedText}</p>`;
    output += '<h2>Resultados del modelo</h2><ul>';

    entities.forEach(entity => {
        output += `<li><strong>Texto:</strong> ${entity.word}<br>`;
        output += `<strong>Tipo:</strong> ${entity.entity}<br>`;
        output += `<strong>Puntuación:</strong> ${entity.score.toFixed(4)}</li>`;
    });

    output += '</ul>';

    // Boton de descarga
    output += '<button id="downloadButton" class="btn btn-primary">Descargar Texto Anonimizado</button>';

    console.log(entities);
    resultDiv.innerHTML = output;

    // EventListener para realizar la descarga del txt
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

