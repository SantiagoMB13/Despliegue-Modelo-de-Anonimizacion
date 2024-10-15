import { zip, anonymizedTexts, textareaContent, registers, updateTextareaContent, usedFilenames, usedFiletypes } from './index.js';
import { Document, Packer, Paragraph } from 'https://cdn.jsdelivr.net/npm/docx@8.2.2/build/index.min.js';

async function displayResults(originalText, replacedText, filename = '') {
   try {
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
    const anonymizedTextArea = document.createElement('textarea');
    anonymizedTextArea.value = replacedText.trim();
    anonymizedTextArea.style.width = '100%';
    anonymizedTextArea.style.height = '300px';
    anonymizedContainer.innerHTML = '<h3>Texto Anonimizado (Editable)</h3>';
    anonymizedContainer.appendChild(anonymizedTextArea);

    // Add event listener to update the anonymized text when edited
    anonymizedTextArea.addEventListener('input', function() {
        const updatedText = this.value;
        anonymizedTexts.set(filename, updatedText);
        updateZipFile(filename, updatedText);
        if (filename === 'texto_ingresado.txt') {
            updateTextareaContent(updatedText);
        }
    });

    // Add the containers to the main container
    container.appendChild(originalContainer);
    container.appendChild(anonymizedContainer);
    // Add the main container to the results div
    if (registers > 1) {
        const fileresult = document.createElement('div');
        fileresult.className = 'file-result';
        const displaybtn = document.createElement('button');
        displaybtn.className = 'collapsible';
        displaybtn.innerHTML = filename === 'texto_ingresado.txt' ? 'Texto Ingresado' : `Archivo: ${filename}`;
        fileresult.appendChild(displaybtn);
        fileresult.appendChild(container);
        resultDiv.appendChild(fileresult);
        
        // Initialize the container as hidden
        container.style.display = 'none';
        
        // Add click event to toggle visibility
        displaybtn.addEventListener('click', function() {
            this.classList.toggle('active');
            if (container.style.display === "none" || container.style.display === "") {
                container.style.display = "flex";
            } else {
                container.style.display = "none";
            }
        });
    } else {
        resultDiv.appendChild(container);
    }
    // Add the anonymized text to the map and zip file
    anonymizedTexts.set(filename, replacedText);
    updateZipFile(filename, replacedText);
   } catch (error) {
         console.error('Error displaying results:', error);
    }
}

function updateZipFile(filename, text) {
    const fileext = filename.split('.').pop().toLowerCase();
    if (fileext === 'txt') {
        zip.file(filename, text);
    } else if (fileext === 'docx') {
        createDOCX(text).then((blob) => {
            zip.file(filename, blob);
        });
    } else if (fileext === 'pdf') {
        const pdfBlob = createPDF(text, filename.split('.').slice(0, -1).join('.'));
        zip.file(filename, pdfBlob);
    }

    if (filename === 'texto_ingresado.txt') {
        updateTextareaContent(text);
    }
}

function generateZip() {
    if (textareaContent) {
        zip.file('texto_ingresado.txt', textareaContent);
    }
    
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'anonymized_files.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clear the processed filenames and anonymized texts after the zip is generated
        usedFilenames.clear();
        usedFiletypes.clear();
        anonymizedTexts.clear();
    });
}

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

async function generateSingleFile() {
    const link = document.createElement('a');
    if (usedFilenames.size == 1) {
        const filename = Array.from(usedFilenames)[0];
        const fileType = Array.from(usedFiletypes)[0];
        const updatedText = anonymizedTexts.get(filename);
        
        if(fileType == 'txt') {
            const blob = new Blob([updatedText], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
        } else if (fileType == 'docx') {
            await createDOCX(updatedText).then((blob) => {
                link.href = URL.createObjectURL(blob);
            });
        } else {
            const namef = filename.split('.').slice(0, -1).join('.');
            const pdfblob = createPDF(updatedText, namef);
            link.href = URL.createObjectURL(pdfblob);    
        }
        link.download = filename;
    } else {
        const blob = new Blob([textareaContent], { type: 'text/plain' });
        link.href = URL.createObjectURL(blob);
        link.download = 'anonymized_text.txt';
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export { displayResults, updateZipFile, generateZip, generateSingleFile };