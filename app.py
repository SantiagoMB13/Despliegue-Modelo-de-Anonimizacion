from flask import Flask, request, render_template, send_file
from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline
import os

app = Flask(__name__)

# Carga del modelo y el tokenizador
model_name = "PlanTL-GOB-ES/roberta-base-bne-capitel-ner-plus"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForTokenClassification.from_pretrained(model_name)
nlp = pipeline("ner", model=model, tokenizer=tokenizer, aggregation_strategy="simple")

def filter_entities(entities, threshold=0.6): # Filtrar entidades con score mayor o igual a 0.6
    return [entity for entity in entities if entity['score'] >= threshold]

def replace_entities(text, entities): # Reemplazar entidades detectadas por etiquetas anonimas según el tipo
    offset = 0
    for entity in entities:
        if entity['entity_group'] == 'PER':
            replacement = 'persona_anonima'
        elif entity['entity_group'] == 'LOC':
            replacement = 'lugar_anonimo'
        else:
            continue

        start, end = entity['start'] + offset, entity['end'] + offset
        text = text[:start] + replacement + text[end:]
        offset += len(replacement) - (end - start)
    
    return text

@app.route('/', methods=['GET', 'POST']) 
def index():
    if request.method == 'POST':
        if 'input_text' in request.form: # Para el manejo de texto ingresado
            input_text = request.form['input_text'] 
            ner_results = nlp(input_text) 
            filtered_results = filter_entities(ner_results)
            modified_text = replace_entities(input_text, filtered_results) 
            return render_template('index.html', input_text=input_text, modified_text=modified_text, ner_results=filtered_results) 
        elif 'file' in request.files: # Para el manejo de archivos .txt
            file = request.files['file']
            if file.filename.endswith('.txt'):
                file_content = file.read().decode('utf-8') 
                ner_results = nlp(file_content)
                filtered_results = filter_entities(ner_results)
                modified_text = replace_entities(file_content, filtered_results)
                modified_file_path = os.path.join('modified_text.txt')
                with open(modified_file_path, 'w', encoding='utf-8') as f: 
                    f.write(modified_text) 
                return send_file(modified_file_path, as_attachment=True) #Se descarga el archivo anonimizado en formato .txt
    return render_template('index.html', input_text='', modified_text='', ner_results=[])

if __name__ == '__main__':
    app.run(debug=True)
