from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class GameSession(db.Model):
    """Modelo para almacenar sesiones y métricas de juegos"""
    __tablename__ = 'game_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(100), nullable=False)
    session_name = db.Column(db.String(100), nullable=False)
    game_name = db.Column(db.String(100), nullable=False)
    game_level = db.Column(db.String(50), nullable=False)
    
    # Métricas
    hits = db.Column(db.Integer, default=0)
    errors = db.Column(db.Integer, default=0)
    score = db.Column(db.Integer, default=0)
    game_duration = db.Column(db.Float, default=0)  # En segundos
    avg_response_time = db.Column(db.Float, default=0)  # En milisegundos
    
    # Respuestas detalladas (almacenadas como JSON)
    responses_detail = db.Column(db.Text, default='[]')  # JSON string
    
    # Datos de movimiento del jugador (almacenados como JSON)
    movement_data = db.Column(db.Text, default='{}')  # JSON string con resumen, eventos y snapshots
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<GameSession {self.player_name} - {self.game_name} ({self.game_level})>'
    
    def to_dict(self):
        """Convertir a diccionario"""
        return {
            'id': self.id,
            'player_name': self.player_name,
            'session_name': self.session_name,
            'game_name': self.game_name,
            'game_level': self.game_level,
            'hits': self.hits,
            'errors': self.errors,
            'score': self.score,
            'game_duration': self.game_duration,
            'avg_response_time': self.avg_response_time,
            'responses_detail': json.loads(self.responses_detail) if self.responses_detail else [],
            'movement_data': json.loads(self.movement_data) if self.movement_data else {},
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def set_responses_detail(self, responses_list):
        """Guardar respuestas detalladas como JSON"""
        self.responses_detail = json.dumps(responses_list)
    
    def get_responses_detail(self):
        """Obtener respuestas detalladas desde JSON"""
        return json.loads(self.responses_detail) if self.responses_detail else []
    
    def set_movement_data(self, movement_dict):
        """Guardar datos de movimiento como JSON"""
        self.movement_data = json.dumps(movement_dict)
    
    def get_movement_data(self):
        """Obtener datos de movimiento desde JSON"""
        return json.loads(self.movement_data) if self.movement_data else {}
