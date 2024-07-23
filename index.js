import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';
import { fakerES as faker } from "https://esm.sh/@faker-js/faker@v8.4.0";
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

// Cargamos el modelo desde Hugging Face
env.allowLocalModels = false;
const pipe = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');

// Initialize JSZip
const zip = new JSZip();

// Selecciona el botón por su ID
const boton = document.getElementById('runmodelbtn');

let anonymizedText = '';

// Evento para el botón de ejecutar modelo
document.getElementById('runmodelbtn').addEventListener('click', async () => {
    const inputText = document.getElementById('input-text').value;
    const mode = document.getElementById('anonimization-mode').value;
    if (inputText) {
        await runNER(inputText, mode, 'input_text.txt');
        document.getElementById('downloadSingleBtn').style.display = 'block';
    } else {
        alert('Por favor, ingrese algún texto.');
    }
});

// Event listener for the download single text button
document.getElementById('downloadSingleBtn').addEventListener('click', () => {
    generateSingleFile();
});

function generateSingleFile() {
    const blob = new Blob([anonymizedText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'anonymized_input_text.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Evento para el botón de subir archivo
document.getElementById('uploadfilebtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;
    const mode = document.getElementById('anonimization-mode').value;
    if (files.length > 0) {
        document.getElementById('result').innerHTML = ''; // Clear previous results
        for (let file of files) {
            await processFile(file, mode);
        }
        // Show the download zip button after processing all files
        document.getElementById('downloadZipBtn').style.display = 'block';
    } else {
        alert('Por favor, suba uno o más archivos.');
    }
});

// Function to process a single file
async function processFile(file, mode) {
    const reader = new FileReader();
    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'txt') {
        reader.onload = async (e) => {
            const inputText = e.target.result;
            await runNER(inputText, mode, file.name);
        };
        reader.readAsText(file);
    } else if (fileType === 'docx') {
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(async (result) => {
                    const inputText = result.value;
                    await runNER(inputText, mode, file.name);
                })
                .catch((error) => {
                    console.error('Error reading .docx file:', error);
                    alert('Error leyendo el archivo .docx.');
                });
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Formato de archivo no soportado. Por favor, suba un archivo .txt o .docx.');
    }
}

// Evento para el botón de limpiar resultados
document.getElementById('clearResultsBtn').addEventListener('click', () => {
    document.getElementById('result').innerHTML = '';
    document.getElementById('input-text').value = '';
    document.getElementById('file-input').value = '';
    document.getElementById('downloadZipBtn').style.display = 'none';
    document.getElementById('downloadSingleBtn').style.display = 'none';
    zip.remove('anonymized_files'); // Clear the zip contents
});

// Función para ejecutar el modelo NER
async function runNER(inputText, mode, filename = '') {
    const resultDiv = document.getElementById('result');

    if (!inputText) {
        resultDiv.textContent = 'Por favor, ingrese algún texto.';
        return;
    }

    resultDiv.innerHTML += `<p>Analizando ${filename}...</p>`;

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
        anonymizedText = replacedText; // Store the anonymized text
        displayResults(replacedText, cleanedEntities, filename);
    } catch (error) {
        resultDiv.innerHTML += `<p>Error al procesar el texto ${filename}: ${error.message}</p>`;
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

// Función para filtrar las entidades con una puntuación menor a 0.6
function filterEntities(entities) {
    return entities.filter(entity => entity.score >= 0.6);
}

// Función para reemplazar las entidades en el texto
function replaceEntities(text, entities, mode) {
    let replacedText = text;

    entities.forEach(entity => {
        let replacement;

        // Se reemplazan las entidades de persona, lugar y organización con datos falsos según el modo seleccionado
        if (mode === 'advanced') {
            if (entity.entity.includes('PER')) {
                replacement = faker.person.firstName() + ' ' + faker.person.lastName();
            } else if (entity.entity.includes('LOC')) {
                if (/\d/.test(entity.word)) { // Si la entidad LOC contiene un número, se asume que es una dirección
                    replacement = faker.location.streetAddress(true);
                } else {
                    replacement = faker.location.country();
                }
            } else if (entity.entity.includes('ORG')) {
                replacement = faker.company.name();
            } else {
                replacement = entity.entity;
            }
        } else if (mode === 'generic') {
            if (entity.entity.includes('PER')) {
                replacement = '[persona]';
            } else if (entity.entity.includes('LOC')) {
                if (/\d/.test(entity.word)) {
                    replacement = '[dirección]';
                } else {
                    replacement = '[lugar]';
                }
            } else if (entity.entity.includes('ORG')) {
                replacement = '[organización]';
            } else {
                replacement = entity.entity;
            }
        }

        const regex = new RegExp(`\\b${entity.word}\\b`, 'g'); // Se reemplaza la entidad solo si es una palabra completa
        replacedText = replacedText.replace(regex, replacement);
    });

    return replacedText;
}

// Función para reemplazar entidades secundarias como correos electrónicos, números de teléfono, cédulas y fechas mediante RegEx
function secondaryReplacements(text, mode) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?<!\d)(\d\s*){10}(?=\s|\n|$)/g;
    const idRegex = /(\d\s*\.?\s*){5,}(?=\s|\n|$)/g;
    const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g; // Se puede separar en 2 para los formatos dd/mm/yyyy y dd-mm-yyyy
    //Ahora mismo se consideran formatos incorrectos como dd-mm/yyyy o dd/mm-yyyy, pero por ahora no se considera un problema al ser un caso demasiado específico
    
    let emailReplacement, phoneReplacement, idReplacement, dateReplacement;
    
    if (mode === 'advanced') {
        emailReplacement = faker.internet.email();
        phoneReplacement = faker.helpers.fromRegExp('[0-9]{10}');
        idReplacement = faker.string.numeric({ length: { min: 5, max: 12 }, allowLeadingZeros: false });
        text = text.replace(dateRegex, (match) => shiftDate(match, 3710)); // Se desplazan las fechas 3710 dias hacia atrás
        text = text.replace(dateRegex, (match) => shiftDate(match, 3710)); // Se desplazan las fechas 3710 dias hacia atrás
    } else {
        emailReplacement = '[email]';
        phoneReplacement = '[celular]'; 
        idReplacement = '[id]';
        text = text.replace(dateRegex, '[fecha]');
        text = text.replace(dateRegex, '[fecha]');
    }
    
    text = text.replace(emailRegex, emailReplacement);
    text = text.replace(phoneRegex, phoneReplacement); 
    text = text.replace(idRegex, idReplacement);
    
    return text;
}

// Función para desplazar una fecha por un número dado de días
function shiftDate(dateStr, days) {
    const [day, month, year] = dateStr.split(/[-/]/).map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - days);
    const newDay = String(date.getDate()).padStart(2, '0');
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newYear = date.getFullYear();
    return `${newDay}-${newMonth}-${newYear}`;
}

// Function to display results on the page and add to zip
function displayResults(replacedText, entities, filename = '') {
    const resultDiv = document.getElementById('result');

    // Create a collapsible section for each file
    let output = `
    <div class="file-result">
        <button class="collapsible">${filename ? `Archivo: ${filename}` : 'Resultado'}</button>
        <div class="content">
            <h2>Texto anonimizado</h2>
            <pre>${replacedText}</pre>
            <h2>Resultados del modelo</h2>
            <ul>`;

    entities.forEach(entity => {
        output += `<li><strong>Texto:</strong> ${entity.word}<br>
            <strong>Tipo:</strong> ${entity.entity}<br>
            <strong>Puntuación:</strong> ${entity.score.toFixed(4)}</li>`;
    });

    output += `</ul>
        </div>
    </div>`;

    // Append the new output instead of overwriting
    resultDiv.innerHTML += output;

    // Add the anonymized text to the zip file
    zip.file(filename ? `${filename.split('.')[0]}_anonimizado.txt` : 'nota_anonimizada.txt', replacedText);

    // Add event listener for collapsible sections
    document.querySelectorAll('.collapsible').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    });
}

function generateZip() {
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'anonymized_files.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// Event listener for the download zip button
document.getElementById('downloadZipBtn').addEventListener('click', () => {
    generateZip();
});