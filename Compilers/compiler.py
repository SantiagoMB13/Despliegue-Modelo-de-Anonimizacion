import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification

# Cargar el modelo y el tokenizer
model_name = "PlanTL-GOB-ES/roberta-base-bne-capitel-ner-plus"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForTokenClassification.from_pretrained(model_name)

# Crear una entrada de ejemplo
text = "Ejemplo de texto para la conversión del modelo."
inputs = tokenizer(text, return_tensors="pt")

# Exportar el modelo a ONNX
torch.onnx.export(
    model,                                      # El modelo de Hugging Face
    (inputs['input_ids'], inputs['attention_mask']),  # Las entradas del modelo
    "roberta-bne-ner.onnx",                      # El nombre del archivo ONNX de salida
    input_names=["input_ids", "attention_mask"],  # Nombres de las entradas
    output_names=["output"],                     # Nombres de las salidas
    dynamic_axes={"input_ids": {0: "batch_size"}, "attention_mask": {0: "batch_size"}, "output": {0: "batch_size"}},  # Ejes dinámicos
    opset_version=11                             # Versión del opset de ONNX
)
