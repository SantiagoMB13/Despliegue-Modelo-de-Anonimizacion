import { usedFilenames, usedFiletypes, updateRegisters, registers } from './index.js';
import { runNER } from './aiProcessing.js';
import { pdfjsLib } from './index.js';

async function processFile(file, mode) {
    // Check if the file is empty
    if (file.size === 0) {
        console.log(`Skipping emptyy file: ${file.name}`);
        updateRegisters(registers - 1);
        return Promise.resolve(); // Skip processing for empty files
    }

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

    // Añadir el nombre de archivo y tipo de archivo a los sets
    usedFilenames.add(finalFileName);
    usedFiletypes.add(fileType);

    return new Promise((resolve, reject) => {
        if (fileType === 'txt') {
            reader.onload = async (e) => {
                const inputText = e.target.result;
                if (inputText.trim() === '') {
                    console.log(`Skipping empty text file: ${file.name}`);
                    updateRegisters(registers - 1);
                    resolve();
                    return;
                }
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
                        if (inputText.trim() === '') {
                            console.log(`Skipping empty DOCX file: ${file.name}`);
                            updateRegisters(registers - 1);
                            resolve();
                            return;
                        }
                        try {
                            await runNER(inputText, mode, finalFileName);
                            resolve(); 
                        } catch (error) {
                            reject(error); 
                        }
                    })
                    .catch((error) => {
                        console.error('Error reading .docx file:', error);
                        Swal.fire({
                            title: '¡Error!',
                            text: 'Hubo un problema al analizar el archivo ' + finalFileName,
                            icon: 'error',
                            confirmButtonText: 'Ok',
                            confirmButtonColor: '#1f2937'
                        });
                        reject(error); 
                    });
            };
            reader.readAsArrayBuffer(file);
        } else if (fileType === 'pdf') {
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;
                try {
                    const inputText = await extractTextFromPDF(arrayBuffer);
                    if (inputText.trim() === '') {
                        console.log(`Skipping empty PDF file: ${file.name}`);
                        updateRegisters(registers - 1);
                        resolve();
                        return;
                    }
                    await runNER(inputText, mode, finalFileName);
                    resolve(); 
                } catch (error) {
                    console.error('Error reading .pdf file:', error);
                    Swal.fire({
                        title: '¡Error!',
                        text: 'Hubo un problema al analizar el archivo ' + finalFileName,
                        icon: 'error',
                        confirmButtonText: 'Ok',
                        confirmButtonColor: '#1f2937'
                    });
                    reject(error); 
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            Swal.fire({
                title: 'Oops...',
                text: 'Formato de archivo no soportado. Por favor, suba un archivo de extensión .txt, .docx o .pdf.',
                icon: 'error',
                confirmButtonText: 'Ok',
                confirmButtonColor: '#1f2937'
            });
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

export { processFile, extractTextFromPDF };



