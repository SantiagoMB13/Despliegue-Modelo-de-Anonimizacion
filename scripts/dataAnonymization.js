import { faker } from './index.js';

// Función para reemplazar las entidades en el texto
function replaceEntities(text, entities, mode) {
    let replacedText = text;

    // Ordenar entidades de la más larga a la más corta para evitar reemplazos parciales
    entities.sort((a, b) => b.word.length - a.word.length);

    entities.forEach(entity => {
        let replacement;

        if (mode === 'advanced') {
            if (entity.entity.includes('PER')) {
                replacement = faker.person.firstName() + ' ' + faker.person.lastName();
            } else if (entity.entity.includes('LOC')) {
                replacement = /\d/.test(entity.word) ? faker.location.streetAddress(true) : faker.location.country();
            } else if (entity.entity.includes('ORG')) {
                replacement = faker.company.name();
            } else {
                //Aquí se puede configurar el manejo para entidades como MISC u OTH
            }
        } else if (mode === 'generic') {
            if (entity.entity.includes('PER')) {
                replacement = '[persona]';
            } else if (entity.entity.includes('LOC')) {
                replacement = /\d/.test(entity.word) ? '[dirección]' : '[lugar]';
            } else if (entity.entity.includes('ORG')) {
                replacement = '[organización]';
            } else {
                //Aquí se puede configurar el manejo para entidades como MISC u OTH
            }
        }

        const regex = new RegExp(`\\b${entity.word.split('').join('\\s*')}\\b`, 'g'); // Se reemplaza la entidad solo si es una palabra completa (ignorando espacios entre medias)
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

export { replaceEntities, secondaryReplacements, shiftDate };