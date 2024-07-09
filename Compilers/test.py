import onnx
import onnxruntime
import numpy as np
from transformers import AutoTokenizer, AutoConfig

# Función para tokenizar la entrada
def tokenize(text, tokenizer, max_length=12):
    inputs = tokenizer(text, return_tensors="np", padding="max_length", truncation=True, max_length=max_length)
    return {
        "input_ids": inputs['input_ids'].astype(np.int64),
        "attention_mask": inputs['attention_mask'].astype(np.int64)
    }

# Función para decodificar las salidas
def decode_outputs(outputs, tokenizer):
    logits = outputs[0]
    predictions = np.argmax(logits, axis=-1)
    labels = [tokenizer.decode([pred]) for pred in predictions[0]]
    return labels

# Verificar el modelo ONNX
onnx_model_path = "roberta-bne-ner.onnx"
onnx_model = onnx.load(onnx_model_path)
onnx.checker.check_model(onnx_model)

# Crear una sesión de ejecución
ort_session = onnxruntime.InferenceSession(onnx_model_path)

# Preparar las entradas
model_name = "PlanTL-GOB-ES/roberta-base-bne-capitel-ner-plus"
tokenizer = AutoTokenizer.from_pretrained(model_name)
config = AutoConfig.from_pretrained(model_name)
label_list = config.id2label

# Entrada de ejemplo
text = "Hola me llamo Santiago y soy de Madrid"
max_length = 12  # Establece la longitud máxima según lo esperado por el modelo
inputs_onnx = tokenize(text, tokenizer, max_length=max_length)

# Ejecutar el modelo ONNX
outputs_onnx = ort_session.run(None, inputs_onnx)

# Decodificar las salidas
logits = outputs_onnx[0]
predictions = np.argmax(logits, axis=-1)
labels = [label_list[pred] for pred in predictions[0]]

print(f"Texto de entrada: {text}")
print(f"Etiquetas predichas: {labels}")

