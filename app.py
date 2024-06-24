from flask import Flask, request, render_template
from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline

app = Flask(__name__)

# Carga del modelo y el tokenizador
model_name = "PlanTL-GOB-ES/roberta-base-bne-capitel-ner-plus"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForTokenClassification.from_pretrained(model_name)
nlp = pipeline("ner", model=model, tokenizer=tokenizer, aggregation_strategy="simple")

def replace_entities(text, entities):
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
        input_text = request.form['input_text']
        ner_results = nlp(input_text)
        modified_text = replace_entities(input_text, ner_results)
        return render_template('index.html', input_text=input_text, modified_text=modified_text, ner_results=ner_results)
    return render_template('index.html', input_text='', modified_text='', ner_results=[])

if __name__ == '__main__':
    app.run(debug=True)
