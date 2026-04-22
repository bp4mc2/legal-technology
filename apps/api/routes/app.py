import sys
import os

from flask import Flask, jsonify, request
from flask_smorest import Api, Blueprint


from api.routes.legal_technology import blp as legal_technology_blp
from api.routes.definition import blp as definition_blp
from api.routes.organisation import blp as organisation_blp
from api.routes.assistant import blp as assistant_blp
from api.services.graphdb_service import get_stats

app = Flask(__name__)
app.config["API_TITLE"] = "Juridische Technologie API"
app.config["API_VERSION"] = "v1"
app.config["OPENAPI_VERSION"] = "3.0.3"
app.config["OPENAPI_URL_PREFIX"] = "/api/docs"
app.config["OPENAPI_SWAGGER_UI_PATH"] = "/"
app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
# Optional debug aid: turn HTTP 4xx/5xx into debuggable exceptions.
if os.getenv("FLASK_DEBUG_TRAP_HTTP") == "1":
    app.config["TRAP_HTTP_EXCEPTIONS"] = True
    app.config["TRAP_BAD_REQUEST_ERRORS"] = True
api = Api(app)

blp = Blueprint("health", "health", url_prefix="/api")

@blp.route("/health")
@blp.response(200, description="API is healthy")
def health():
    """Health check endpoint"""
    return {"status": "ok"}


api.register_blueprint(blp)
api.register_blueprint(legal_technology_blp)
api.register_blueprint(definition_blp)
api.register_blueprint(organisation_blp)
api.register_blueprint(assistant_blp)

# Register /api/stats at the app level
@app.route('/api/stats')
def stats():
    return get_stats()

@app.route('/')
def root():
    """Root endpoint met welkomsbericht en API-overzicht."""
    return jsonify({
        'message': 'Welkom bij de Juridische Technologie API!',
        'info': 'Deze API biedt toegang tot juridische technologieën en definities.',
        'endpoints': {
            '/api/health': 'Health check',
            '/api/assistant/status': 'Controleer status van de natural language assistent',
            '/api/assistant/ask': 'Stel een vraag in natuurlijke taal (POST)',
            '/api/legaltechnologies/search': 'Zoek juridische technologieën',
            '/api/legaltechnologies': 'Voeg toe (POST), lijst (GET)',
            '/api/legaltechnologies/<id>': 'Ophalen (GET), bijwerken (PUT), verwijderen (DELETE)',
            '/api/legaltechnologies/enumerations': 'Lijst van enumeraties',
            '/api/legaltechnologies/tasktypes': 'Lijst van taaktypen met beschrijving',
            '/api/organisations': 'Voeg toe (POST), lijst (GET)',
            '/api/organisations/<iri>': 'Ophalen (GET), bijwerken (PUT), verwijderen (DELETE)',
            '/api/definitions': 'Lijst, toevoegen van SKOS-definities',
            '/api/definitions/<id>': 'Ophalen, bijwerken van SKOS-definities',
            '/api/stats': 'Statistieken over technologieën'
        },
        'docs': 'Zie /api/docs voor documentatie.'
    })


if __name__ == "__main__":
    # Keep a single process for stable VS Code/debugpy sessions.
    app.run(debug=True, use_reloader=False)
