import { processFile } from './dataExtraction.js';
import { runNER } from './aiProcessing.js';
import { generateZip, generateSingleFile } from './dataSynthesis.js';
import { env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';
import { fakerES as faker } from "https://esm.sh/@faker-js/faker@v8.4.0";
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.10.377/+esm';
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';

// Load the model from Hugging Face
env.allowLocalModels = false;
const pipe = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');

// Acceder a los labels del modelo
const labels = pipe.model.config.id2label;

function verifyLabels(labels) {
    // Variables para almacenar si se encontraron los labels
    let hasPER = false;
    let hasLOC = false;
    let hasORG = false;

    // Iterar sobre los labels
    for (const label of Object.values(labels)) {
        if (label.includes('PER')) hasPER = true;
        if (label.includes('LOC')) hasLOC = true;
        if (label.includes('ORG')) hasORG = true;

        // Si ya se encontraron los tres, no es necesario continuar
        if (hasPER && hasLOC && hasORG) {
            return true;
        }
    }

    // Si no se encontraron los tres labels, retornar false
    Swal.fire({
        title: "Advertencia",
        text: "El modelo cargado no contiene los labels genéricos PER, LOC, y ORG. Por favor, carga un modelo que contenga estos labels o enmascara los de tu modelo en estos 3. De lo contrario, los resultados podrían no ser los esperados.",
        icon: "warning"
      });
    return hasPER && hasLOC && hasORG;
}

verifyLabels(labels);

// Set the workerSrc for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

// Initialize global variables
let zip = new JSZip();
let anonymizedText = '';
let usingFile = false;
let registers = 0;
let emptyfiles = 0;
let textareaContent = '';
let usedFilenames = new Set();
let usedFiletypes = new Set();
let anonymizedTexts = new Map();

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

// Evento para el botón de subir archivos (para limpiar el input) cuando se da click
document.getElementById('file-input').addEventListener('click', function() {
    this.value = null;
});

// Evento para el label de subir archivos
document.getElementById('file-input').addEventListener('change', function() {
    var fileInput = document.getElementById('file-input');
    var fileCount = document.getElementById('file-count');
    document.getElementById('downloadSingleBtn').style.display = 'none';
    usedFilenames.clear();
    usedFiletypes.clear();
    if (fileInput.files.length === 0) {
        fileCount.textContent = 'No hay archivos seleccionados';
        usingFile = false;
    } else if (fileInput.files.length === 1) {
        fileCount.textContent = '1 archivo seleccionado';
        usingFile = false;
    } else {
        fileCount.textContent = fileInput.files.length + ' archivos seleccionados';
        usingFile = true;
    }
});

// Evento para el botón de ejecutar modelo
document.getElementById('runmodelbtn').addEventListener('click', async () => {
    clearCache();
    showPopup();
    const inputText = document.getElementById('input-text').value;
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;
    const mode = document.getElementById('anonimization-mode').value;
    registers = registers + files.length;
    if (inputText && inputText.trim().length > 0) {
        registers = registers + 1;
    }
    const oriregs = registers;
    console.log('Número de registros:', oriregs);
    console.log(emptyfiles);
    if (files.length > 0) {
        zip = new JSZip(); 
        // Crear un array de promesas
        const fileProcessingPromises = Array.from(files).map(file => processFile(file, mode));
        try {
            await Promise.all(fileProcessingPromises); // Esperar a que todas las promesas se resuelvan
        } catch (error) {
            console.error('Error procesando archivos:', error);
        } finally {
            hidePopup(); // Esconder el popup de carga
        }
    }
    if (inputText && inputText.trim().length > 0) {
        textareaContent = inputText;
        await runNER(inputText, mode, 'texto_ingresado.txt');
    }
    console.log(emptyfiles);
    if (registers > 1) {
        usingFile = true;
        document.getElementById('downloadSingleBtn').style.display = 'none';
        document.getElementById('downloadZipBtn').style.display = 'block';
    } else {
        if (registers === 1) {
            document.getElementById('downloadSingleBtn').style.display = 'block';
            document.getElementById('downloadZipBtn').style.display = 'none';
        } else {
            if (emptyfiles == oriregs && oriregs > 0) {
                Swal.fire({
                    title: 'Oops...',
                    text: 'Solo ingresaste archivos vacíos, por favor intenta de nuevo.',
                    icon: 'error',
                    confirmButtonText: 'Ok',
                    confirmButtonColor: '#1f2937'
                  });
        } else {
            Swal.fire({
                title: 'Oops...',
                text: 'Por favor ingresa un archivo o texto para analizar.',
                icon: 'error',
                confirmButtonText: 'Ok',
                confirmButtonColor: '#1f2937'
              });
        }
    }
    }
    hidePopup();
});

document.getElementById('downloadSingleBtn').addEventListener('click', () => {
    generateSingleFile();
});


// Evento para el botón de limpiar resultados
document.getElementById('clearResultsBtn').addEventListener('click', () => {
    clearCache();
    clearData();
});

function clearCache(){
    const resultDiv = document.getElementById('result');
    resultDiv.classList.add('hidden');
    resultDiv.innerHTML = '';
    document.getElementById('downloadZipBtn').style.display = 'none';
    document.getElementById('downloadSingleBtn').style.display = 'none';
    document.getElementById('clearResultsBtn').classList.add('hidden');
    var fileCount = document.getElementById('file-count');
    fileCount.textContent = 'No hay archivos seleccionados';
    zip = new JSZip();
    registers = 0;
    emptyfiles = 0;
    usingFile = false;
    usedFilenames.clear(); 
    usedFiletypes.clear(); 
    anonymizedTexts.clear();
}

function clearData() { 
    document.getElementById('input-text').value = '';
    document.getElementById('file-input').value = '';
}

// Event listener for the download zip button
document.getElementById('downloadZipBtn').addEventListener('click', () => {
    generateZip();
});

function updateTextareaContent(text) {
    textareaContent = text;
}

function updateRegisters(newValue) {
    registers = newValue;
    emptyfiles++;
}

window.textAreaAdjust = function(element){
    element.style.height = "1px";
    element.style.height = (element.scrollHeight)+"px";
}

export { pipe, updateTextareaContent, zip, anonymizedText, usingFile, registers, textareaContent, usedFilenames, usedFiletypes, anonymizedTexts, faker, pdfjsLib, updateRegisters };