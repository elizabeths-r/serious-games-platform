#!/usr/bin/env python3
"""
Script de utilidad para consultar y exportar métricas de la base de datos
"""

import os
import sys
import json
from datetime import datetime
import pandas as pd
from models import db, GameSession
from web_interface_portuguese import app

def print_all_metrics():
    """Mostrar todas las métricas en la consola"""
    with app.app_context():
        sessions = GameSession.query.all()
        
        if not sessions:
            print("❌ No hay datos en la base de datos")
            return
        
        print(f"\n{'='*100}")
        print(f"{'MÉTRICAS DE JUEGOS':^100}")
        print(f"{'='*100}")
        print(f"Total de sesiones: {len(sessions)}\n")
        
        for idx, session in enumerate(sessions, 1):
            print(f"\n📊 Sesión #{idx}")
            print(f"  Jugador:          {session.player_name}")
            print(f"  Sesión:           {session.session_name}")
            print(f"  Juego:            {session.game_name}")
            print(f"  Nivel:            {session.game_level}")
            print(f"  Aciertos:         {session.hits}")
            print(f"  Errores:          {session.errors}")
            print(f"  Puntuación:       {session.score}")
            print(f"  Duración:         {session.game_duration:.1f}s")
            print(f"  Resp. Promedio:   {session.avg_response_time:.0f}ms")
            print(f"  Fecha:            {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}")

def export_to_csv(filename='game_metrics.csv'):
    """Exportar métricas a CSV"""
    with app.app_context():
        sessions = GameSession.query.all()
        
        if not sessions:
            print("❌ No hay datos para exportar")
            return
        
        data = [s.to_dict() for s in sessions]
        
        # Convertir respuestas detalladas a string
        for d in data:
            d['responses_detail'] = json.dumps(d['responses_detail'])
        
        df = pd.DataFrame(data)
        df.to_csv(filename, index=False, encoding='utf-8')
        print(f"✅ Datos exportados a: {filename}")

def export_to_json(filename='game_metrics.json'):
    """Exportar métricas a JSON"""
    with app.app_context():
        sessions = GameSession.query.all()
        
        if not sessions:
            print("❌ No hay datos para exportar")
            return
        
        data = [s.to_dict() for s in sessions]
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Datos exportados a: {filename}")

def get_metrics_by_player(player_name):
    """Obtener métricas de un jugador específico"""
    with app.app_context():
        sessions = GameSession.query.filter_by(player_name=player_name).all()
        
        if not sessions:
            print(f"❌ No hay datos para el jugador: {player_name}")
            return
        
        print(f"\n{'='*100}")
        print(f"{'MÉTRICAS DE':^100} {player_name}")
        print(f"{'='*100}\n")
        
        for idx, session in enumerate(sessions, 1):
            print(f"Sesión #{idx}: {session.game_name} ({session.game_level})")
            print(f"  Aciertos: {session.hits} | Errores: {session.errors} | Puntuación: {session.score}")
            print(f"  Duración: {session.game_duration:.1f}s | Resp. Promedio: {session.avg_response_time:.0f}ms")
            print()

def get_summary_stats():
    """Mostrar estadísticas resumidas"""
    with app.app_context():
        sessions = GameSession.query.all()
        
        if not sessions:
            print("❌ No hay datos en la base de datos")
            return
        
        total_sessions = len(sessions)
        unique_players = len(set(s.player_name for s in sessions))
        unique_games = len(set(s.game_name for s in sessions))
        
        avg_hits = sum(s.hits for s in sessions) / total_sessions
        avg_errors = sum(s.errors for s in sessions) / total_sessions
        avg_score = sum(s.score for s in sessions) / total_sessions
        avg_duration = sum(s.game_duration for s in sessions) / total_sessions
        avg_response = sum(s.avg_response_time for s in sessions) / total_sessions
        
        print(f"\n{'='*60}")
        print(f"{'ESTADÍSTICAS GENERALES':^60}")
        print(f"{'='*60}")
        print(f"Total de sesiones:       {total_sessions}")
        print(f"Jugadores únicos:        {unique_players}")
        print(f"Juegos jugados:          {unique_games}")
        print(f"\nPromedios:")
        print(f"  Aciertos:              {avg_hits:.1f}")
        print(f"  Errores:               {avg_errors:.1f}")
        print(f"  Puntuación:            {avg_score:.1f}")
        print(f"  Duración:              {avg_duration:.1f}s")
        print(f"  Resp. Promedio:        {avg_response:.0f}ms")
        print(f"{'='*60}\n")

def clear_database():
    """Limpiar la base de datos"""
    response = input("⚠️  ¿Estás seguro de que quieres limpiar la base de datos? (s/n): ")
    if response.lower() == 's':
        with app.app_context():
            db.session.query(GameSession).delete()
            db.session.commit()
            print("✅ Base de datos limpiada")
    else:
        print("Cancelado")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'show':
            print_all_metrics()
        elif command == 'csv':
            filename = sys.argv[2] if len(sys.argv) > 2 else 'game_metrics.csv'
            export_to_csv(filename)
        elif command == 'json':
            filename = sys.argv[2] if len(sys.argv) > 2 else 'game_metrics.json'
            export_to_json(filename)
        elif command == 'player' and len(sys.argv) > 2:
            get_metrics_by_player(sys.argv[2])
        elif command == 'stats':
            get_summary_stats()
        elif command == 'clear':
            clear_database()
        else:
            print("Comandos disponibles:")
            print("  python query_metrics.py show            - Mostrar todas las métricas")
            print("  python query_metrics.py csv [archivo]   - Exportar a CSV")
            print("  python query_metrics.py json [archivo]  - Exportar a JSON")
            print("  python query_metrics.py player [nombre] - Métricas de un jugador")
            print("  python query_metrics.py stats           - Estadísticas generales")
            print("  python query_metrics.py clear           - Limpiar base de datos")
    else:
        # Mostrar menú interactivo
        while True:
            print("\n" + "="*60)
            print("GESTOR DE MÉTRICAS DE JUEGOS")
            print("="*60)
            print("1. Ver todas las métricas")
            print("2. Exportar a CSV")
            print("3. Exportar a JSON")
            print("4. Ver métricas de un jugador")
            print("5. Ver estadísticas generales")
            print("6. Limpiar base de datos")
            print("0. Salir")
            print("="*60)
            
            choice = input("Selecciona una opción: ").strip()
            
            if choice == '1':
                print_all_metrics()
            elif choice == '2':
                export_to_csv()
            elif choice == '3':
                export_to_json()
            elif choice == '4':
                player = input("Nombre del jugador: ")
                get_metrics_by_player(player)
            elif choice == '5':
                get_summary_stats()
            elif choice == '6':
                clear_database()
            elif choice == '0':
                print("Hasta luego!")
                break
            else:
                print("❌ Opción no válida")
