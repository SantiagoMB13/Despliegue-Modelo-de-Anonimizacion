import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';
import { fakerES as faker } from "https://esm.sh/@faker-js/faker@v8.4.0";
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.10.377/+esm';
import { Document, Packer, Paragraph } from 'https://cdn.jsdelivr.net/npm/docx@8.2.2/build/index.min.js';
const { jsPDF } = window.jspdf;

// Set the workerSrc for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

// Cargamos el modelo desde Hugging Face
env.allowLocalModels = false;
const pipe = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');

// Initialize JSZip
let zip = new JSZip();

let anonymizedText = '';
let usingFile = false;

// Muestra el popup
function showPopup() {
    var popup = document.getElementById('popup');
    popup.style.display = 'flex'; // Cambia a 'flex' para mostrar el popup
}

// Esconde el popup
function hidePopup() {
    var popup = document.getElementById('popup');
    popup.style.display = 'none'; // Cambia a 'none' para esconder el popup
}

// Evento para el label de subir archivos
document.getElementById('file-input').addEventListener('change', function() {
    var fileInput = document.getElementById('file-input');
    var fileCount = document.getElementById('file-count');
    var analizebtn = document.getElementById('uploadfilebtn');
    document.getElementById('downloadSingleBtn').style.display = 'none';
    usedFilenames.clear();
    usedFiletypes.clear();
    if (fileInput.files.length === 0) {
        fileCount.textContent = 'No hay archivos seleccionados';
        analizebtn.style.display = 'none';
        usingFile = false;
    } else if (fileInput.files.length === 1) {
        fileCount.textContent = '1 archivo seleccionado';
        analizebtn.style.display = 'inline-block';
        usingFile = false;
    } else {
        fileCount.textContent = fileInput.files.length + ' archivos seleccionados';
        analizebtn.style.display = 'inline-block';
        usingFile = true;
    }
});

// Evento para el botón de ejecutar modelo
document.getElementById('runmodelbtn').addEventListener('click', async () => {
    clearCache();
    const inputText = document.getElementById('input-text').value;
    const mode = document.getElementById('anonimization-mode').value;
    if (inputText) {
        usingFile = false;
        await runNER(inputText, mode, 'texto ingresado');
        document.getElementById('downloadSingleBtn').style.display = 'block';
    } else {
        alert('Por favor, ingrese algún texto.');
    }
});

function createPDF(text, fname) {
    const doc = new jsPDF();
    doc.setFontSize(10);
    // Define el ancho máximo de texto por línea sin margen derecho
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const maxLineWidth = pageWidth + 2*margin;
    // Divide el texto en líneas que se ajustan al ancho máximo
    const textLines = doc.splitTextToSize(text, maxLineWidth);
    // Define la altura inicial
    let yOffset = margin; // Comienza en el margen superior
    const lineHeight = 10;
    // Añade las líneas de texto al documento, y gestiona saltos de página si es necesario
    textLines.forEach((line) => {
        if (yOffset + lineHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yOffset = margin; // Restablece la altura inicial en la nueva página
        }
        doc.text(line, margin, yOffset);
        yOffset += lineHeight;
    });
    return doc.output('blob');
}


async function createDOCX(text) {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph(text)
            ],
        }],
    });
    return await Packer.toBlob(doc);
}

document.getElementById('downloadSingleBtn').addEventListener('click', () => {
    generateSingleFile();
});

async function generateSingleFile() {
    const link = document.createElement('a');
    if (usedFilenames.size == 1) {
        const Typeoffile = Array.from(usedFiletypes)[0];
        if(Typeoffile == 'txt') {
            const blob = new Blob([anonymizedText], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
        } else if (Typeoffile == 'docx') {
            await createDOCX(anonymizedText).then((blob) => {
                link.href = URL.createObjectURL(blob);
            });
        } else {
            const namef = Array.from(usedFilenames)[0].split('.').slice(0, -1).join('.');
            const pdfblob = createPDF(anonymizedText, namef);
            link.href = URL.createObjectURL(pdfblob);    
        }
    } else {
        const blob = new Blob([anonymizedText], { type: 'text/plain' });
        link.href = URL.createObjectURL(blob);
    }
    if (usedFilenames.size == 1) {
        const namef = Array.from(usedFilenames)[0].split('.').slice(0, -1).join('.');
        const typef = Array.from(usedFiletypes)[0];
        link.download = `${namef}.${typef}`;
    } else {
        link.download = 'anonymized_text.txt';
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.getElementById('uploadfilebtn').addEventListener('click', async () => {
    clearCache();
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;
    const mode = document.getElementById('anonimization-mode').value;

    if (files.length > 0) {
        if (files.length > 1) {
            usingFile = true;
        }

        document.getElementById('result').innerHTML = ''; 
        zip = new JSZip(); 
        showPopup(); // Mostrar el popup de carga

        // Crear un array de promesas
        const fileProcessingPromises = Array.from(files).map(file => processFile(file, mode));

        try {
            // Esperar a que todas las promesas se resuelvan
            await Promise.all(fileProcessingPromises); // Esperar a que todas las promesas se resuelvan
            
            // Mostrar el botón de descarga del zip
            if (files.length > 1) {
                document.getElementById('downloadZipBtn').style.display = 'block';
                document.getElementById('downloadSingleBtn').style.display = 'none';
            } else {
                document.getElementById('downloadZipBtn').style.display = 'none';
            }
        } catch (error) {
            console.error('Error procesando archivos:', error);
        } finally {
            hidePopup(); // Esconder el popup de carga
        }
    } else {
        alert('Por favor, suba uno o más archivos.');
    }
});

let usedFilenames = new Set();
let usedFiletypes = new Set();

async function processFile(file, mode) {
    const reader = new FileReader();
    const fileType = file.name.split('.').pop().toLowerCase();

    // Extraer el nombre de archivo y extensión
    let baseName = file.name.split('.').slice(0, -1).join('.');
    let uniqueName = baseName;
    let counter = 1;

    // Asegurarse de que el nombre de archivo sea único
    while (usedFilenames.has(`${uniqueName}_anonimizado.${fileType}`)) {
        uniqueName = `${baseName}(${counter})`;
        counter++;
    }
    const finalFileName = `${uniqueName}_anonimizado.${fileType}`;


    // Añaadir el nombre de archivo y tipo de archivo a los sets
    usedFilenames.add(finalFileName);
    usedFiletypes.add(fileType);

    return new Promise((resolve, reject) => {
        if (fileType === 'txt') {
            reader.onload = async (e) => {
                const inputText = e.target.result;
                try {
                    await runNER(inputText, mode, finalFileName);
                    resolve(); 
                } catch (error) {
                    reject(error); 
                }
            };
            reader.readAsText(file);
        } else if (fileType === 'docx') {
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(async (result) => {
                        const inputText = result.value;
                        try {
                            await runNER(inputText, mode, finalFileName);
                            resolve(); 
                        } catch (error) {
                            reject(error); 
                        }
                    })
                    .catch((error) => {
                        console.error('Error reading .docx file:', error);
                        alert('Error leyendo el archivo .docx.');
                        reject(error); 
                    });
            };
            reader.readAsArrayBuffer(file);
        } else if (fileType === 'pdf') {
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;
                try {
                    const inputText = await extractTextFromPDF(arrayBuffer);
                    await runNER(inputText, mode, finalFileName);
                    resolve(); 
                } catch (error) {
                    console.error('Error reading .docx file:', error);
                    alert('Error leyendo el archivo .pdf.');
                    reject(error); 
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Formato de archivo no soportado. Por favor, suba un archivo .txt, .docx o .pdf.');
            reject(new Error('Formato de archivo no soportado'));
        }
    });
}

async function extractTextFromPDF(arrayBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let pageText = '';

        textContent.items.forEach((item, index) => {
            pageText += item.str;
            // Si el siguiente item está en una posición mucho más baja, considera que es un salto de línea
            if (index < textContent.items.length - 1) {
                const currentY = item.transform[5];
                const nextY = textContent.items[index + 1].transform[5];
                if (Math.abs(currentY - nextY) > 10) { // Ajusta este umbral según sea necesario
                    pageText += '\n';
                }
            }
        });

        text += pageText + '\n';
    }
    return text;
}


// Evento para el botón de limpiar resultados
document.getElementById('clearResultsBtn').addEventListener('click', () => {
    clearCache();
    clearData();
});

function clearCache(){
    document.getElementById('result').innerHTML = '';
    document.getElementById('downloadZipBtn').style.display = 'none';
    document.getElementById('downloadSingleBtn').style.display = 'none';
    zip = new JSZip(); // Reinitialize JSZip to clear previous files
    usedFilenames.clear(); // Clear the processed filenames set
    usedFiletypes.clear(); // Clear the processed filetypes set
}

function clearData() { 
    document.getElementById('input-text').value = '';
    document.getElementById('file-input').value = '';
    usingFile = false;
}

// Función para ejecutar el modelo NER
async function runNER(inputText, mode, filename = '') {
    const resultDiv = document.getElementById('result');

    if (!inputText) {
        resultDiv.textContent = 'Por favor, ingrese algún texto.';
        return;
    }

    resultDiv.innerHTML += `<p id="file-${filename}">Analizando ${filename}...</p>`;
    var loadinglabel = document.getElementById(`file-${filename}`);

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
        loadinglabel.parentNode.removeChild(loadinglabel); // Eliminar el mensaje de carga
        displayResults(inputText, replacedText, filename);
        
        // If only one file is processed, enable the single file download
        if (filename && document.getElementById('file-input').files.length === 1) {
            document.getElementById('downloadSingleBtn').style.display = 'block';
            document.getElementById('downloadZipBtn').style.display = 'none';
        }

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
        text = text.replace(dateRegex, (match) => shiftDate(match, 3710));
    } else {
        emailReplacement = '[email]';
        phoneReplacement = '[celular]'; 
        idReplacement = '[id]';
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
async function displayResults(originalText, replacedText, filename = '') {
    const resultDiv = document.getElementById('result');

    // Create the container to display texts side by side
    const container = document.createElement('div');
    container.className = 'result-container';

    // Create the container for the original text
    const originalContainer = document.createElement('div');
    originalContainer.className = 'text-container';
    originalContainer.innerHTML = '<h3>Texto Original</h3><pre>' + originalText + '</pre>';

    // Create the container for the anonymized text
    const anonymizedContainer = document.createElement('div');
    anonymizedContainer.className = 'text-container';
    anonymizedContainer.innerHTML = '<h3>Texto Anonimizado</h3><pre>' + replacedText + '</pre>';

    // Add the containers to the main container
    container.appendChild(originalContainer);
    container.appendChild(anonymizedContainer);

    // Add the main container to the results div
    if (usingFile == true) {
        container.style.display = 'none';
        const fileresult = document.createElement('div');
        fileresult.className = 'file-result';
        const displaybtn = document.createElement('button');
        displaybtn.className = 'collapsible';
        displaybtn.innerHTML = filename ? `Archivo: ${filename}` : 'Nota clínica';
        fileresult.appendChild(displaybtn);
        fileresult.appendChild(container);
        resultDiv.appendChild(fileresult);
    } else {
        resultDiv.appendChild(container);
    }

    // Add the anonymized text to the zip file
    const fileext = filename.split('.').pop().toLowerCase();
    if (fileext === 'txt') {
        zip.file(filename, replacedText);
    } else if (fileext === 'docx') {
        await createDOCX(anonymizedText).then((blob) => {
            zip.file(filename, blob);
        });
    } else if (fileext === 'pdf') {
        const pdfBlob = createPDF(anonymizedText, filename.split('.').slice(0, -1).join('.'));
        zip.file(filename, pdfBlob);
    }

    // Add event listener for collapsible sections
    document.querySelectorAll('.collapsible').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.display === "flex") {
                content.style.display = "none";
            } else {
                content.style.display = "flex";
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

        // Clear the processed filenames set after the zip is generated
        usedFilenames.clear();
        usedFiletypes.clear();
    });
}

// Event listener for the download zip button
document.getElementById('downloadZipBtn').addEventListener('click', () => {
    generateZip();
});