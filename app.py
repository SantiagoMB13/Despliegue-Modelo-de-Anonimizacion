from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from faker import Faker
app = Flask(__name__, static_url_path='', static_folder='static')
fake = Faker()
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/fake_entity', methods=['GET'])
def fake_entity():
    entity_type = request.args.get('type', 'name')
    if entity_type == 'name':
        entity = fake.name()
    elif entity_type == 'address':
        entity = fake.address()
    elif entity_type == 'email':
        entity = fake.email()
    else:
        entity = fake.word()

    return jsonify({'fake_data': entity})

if __name__ == '__main__':
    app.run(debug=True)
