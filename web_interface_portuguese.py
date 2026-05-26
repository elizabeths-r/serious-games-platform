#! /usr/bin/env python3
import time
import os
from datetime import datetime
#import rospy
import subprocess
import re
from flask import Flask, render_template, request, jsonify,redirect, url_for
import threading  
#from pydub import AudioSegment
#from pydub.playback import play

from acciones import Acciones
from utils import remove_emojis
from get_activities import get_activities
from models import db, GameSession

#from std_msgs.msg import Float64
#from std_msgs.msg import String
#from std_msgs.msg import Bool

######################################
################ ROS #################
######################################

#threading.Thread(target=lambda: rospy.init_node('mainMenuHTML', disable_signals=True)).start()

######################################
############# PUBLISHERS #############
######################################

# pubEmotions = rospy.Publisher('/emotions', String, queue_size = 10)
# pubSpeaker = rospy.Publisher('/speaker', String, queue_size = 10)
# pubSpeakerAction = rospy.Publisher('/speakerAction', String, queue_size = 15)
# pubMovements = rospy.Publisher('/movements', String, queue_size = 5)
# pubCastorSystem = rospy.Publisher('/castor_system', String, queue_size = 5)
#pubMicrophone = rospy.Publisher('/mic', String, queue_size = 5)
# pubText = rospy.Publisher('/microphone', String, queue_size = 5)
# pubAudio = rospy.Publisher('/chat_output', String, queue_size = 5)

### Suscribirme al topic de arriba para mostrar el texto
acciones = Acciones()

# text = ""

# def callbackText(msg):
#     new_text = True
#     global text
#     text = msg.data
#     #print(text)
#     return

# subText = rospy.Subscriber('/chat_output', String, callbackText)

######################################
############# MAIN MENU ##############
######################################

app = Flask(__name__)

# Configuración de la Base de Datos
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///game_metrics.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar la base de datos
db.init_app(app)

# Crear las tablas si no existen
with app.app_context():
    db.create_all()
@app.route("/")
def mainMenu():
	templateData = {
		'title' : 'Main Menu',
	}
	return render_template('mainMenu.html', **templateData)

@app.route("/<action>")
def actionMainMenu(action):
    template = "mainMenu.html"

    acciones.Main_Menu(action=action)

    if action == "Activities":
        template = "Actividades.html"
    elif action == "shutdown":
        template = "shutdown.html"
    elif action == "reboot":
        template = "reboot.html"
    elif action == "Text":
        template = "Texto.html"
    elif action == "Pseudoprogramacion":
        template = "Pseudoprogramacion.html"
    elif action == "Ativar":
        print("Activo")
        #pubMicrophone.publish("Activo")
    elif action == "Desativar":
        print("Inactivo")
        #pubMicrophone.publish("Inactivo")
    
    templateData = {
        'title' : 'Main Menu',
        }
    return render_template(template, **templateData)


#########################################
################ Shutdown ###############
#########################################

@app.route("/shutdown/<action>")
def action1(action):
	if action == "yes":
	# 	pubCastorSystem.publish("shutdown")
	#	time.sleep(0.5)
	# 	subprocess.call(['sudo', 'shutdown', 'now'], shell=False)
		template = "shutdown.html"

	if action == "no":
		print("no")
		template = "mainMenu.html"

	templateData = {
	 	'title' : 'Shutdown',
	 }
	return render_template(template, **templateData)

#########################################
################ Reboot #################
#########################################

@app.route("/reboot/<action>")
def action2(action):
	if action == "yes":
		#pubCastorSystem.publish("reboot")
		#time.sleep(0.5)
		#subprocess.call(['sudo', 'reboot', 'now'], shell=False)
		template = "reboot.html"
	elif action == "no":
		template = "mainMenu.html"
	templateData = {
		'title' : 'Reboot',
	}
	return render_template(template, **templateData)


##############################################
################# Actividades ################
##############################################

@app.route("/Activities/<action>")
def actionAct(action):
    template = 'Actividades.html'
    if action == "A1":
        template = 'Act1_sargento.html'
    elif action == "A2":
        template = 'Act2_cuenJose.html'
    elif action == "A3":
        template = 'Act3_bailar.html'
    elif action == "A4":
        template = 'Act4_cantar.html'
    elif action == "A5":
        template = 'Act5_cuenNarra.html'
    elif action == "A6":
        template = 'Conversation.html'
    elif action == "A7":
        template = 'ActivitiesHug.html'
    
    templateData = {
		'title' : 'Activities',
	}
    return render_template(template, **templateData)

#################################################
##################### Act1 ######################
#################################################
@app.route("/Activities/A1/<action>")
def actionL1_A1(action):
    template = 'Act1_sargento.html'
    
	# if action == "songBattle":
	# 	pubSpeaker.publish("o_mestre_mandou")
	# elif action == "explain":
	# 	pubSpeaker.publish("siga_instrucoes_mestre")

    # Indications
    acciones.IndicacionesAct1(action=action)
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)
    acciones.emotions(action=action)
        
    templateData = {
 		'title' : 'A1',
 	}
    return render_template(template, **templateData)

#############################################
##################### Act 2 #################
#############################################

@app.route("/Activities/A2/<action>")
def actionL1_A2(action):
    template = 'Act2_cuenJose.html'
    
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)
    acciones.emotions(action=action)

	# if action == "explain2":
	# 	pubSpeaker.publish("ver_escutar_historia")
	# elif action == "explain3":
	# 	pubSpeaker.publish("responder_algumas_perguntas")

    
    if action == "jose1":
        template = 'level3Memory1.html'
    elif action == "jose2":
        template = 'level3Memory2.html'
    elif action == "jose4":
        template = 'level3Memory4.html'
    elif action == "jose5":
        template = 'level3Memory5.html'

    templateData = {
 		'title' : 'A2',
   		}
    return render_template(template, **templateData)

###################################################
################# Act 2 History 1 #################
###################################################
@app.route("/Activities/A2/history1/<action>")
def actionL1_A2_1(action):
    template = 'level3Memory1.html'
    
    acciones.SegmentoAct2_History1(action=action)
    acciones.Reproduction(action=action)
    acciones.QuestionAct2_History1(action=action)
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)
    acciones.emotions(action=action)

    templateData = {
		'title' : 'A2 History 1',
  		}
    return render_template(template, **templateData)

###################################################
################# Act 2 History 2 #################
###################################################
@app.route("/Activities/A2/history2/<action>")
def actionL2_A2_2(action):
    template = 'level3Memory2.html'
    
    acciones.SegmentoAct2_History2(action=action)
    acciones.Reproduction(action=action)
    acciones.QuestionAct2_History2(action=action)
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)
    acciones.emotions(action=action)

    templateData = {
 		'title' : 'A2 History 2',
 	}
    return render_template(template, **templateData)

# ###############################################
# ################ Act2 History 4 ###############
# ###############################################
@app.route("/Activities/A2/history4/<action>")
def actionL1_A2_4(action):
    template = 'level3Memory4.html'
    
    acciones.SegmentoAct2_History4(action=action)
    acciones.Reproduction(action=action)
    acciones.QuestionAct2_History4(action=action)
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)
    acciones.emotions(action=action)
    
    templateData = {
		'title' : 'A3 History 4',
	}
    return render_template(template, **templateData)

################################################
################ Act 2 History 5 ###############
################################################
@app.route("/Activities/A2/history5/<action>")
def actionL1_A2_5(action):
    template = 'level3Memory5.html'
    
    acciones.SegmentoAct2_History5(action=action)
    acciones.Reproduction(action=action)
    acciones.QuestionAct2_History5(action=action)
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)
    acciones.emotions(action=action)

    templateData = {
		'title' : 'A2 History 5',
	}
    return render_template(template, **templateData)

############################################
################## Act 3 ###################
############################################
@app.route("/Activities/A3/<action>")
def actionL2_A2(action):
    template = 'Act3_bailar.html'
	# if action == "explain":
	# 	pubSpeaker.publish("siga_instrucoes")

    acciones.Dance(action=action)
    acciones.Reproduction(action=action)
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)
    acciones.emotions(action=action)
    
    templateData = {
		'title' : 'A3',
	}
    return render_template(template, **templateData)
	
	
############################################
################## Act 4 ###################
############################################
@app.route("/Activities/A4/<action>")
def actionL2_A4(action):
    template = 'Act4_cantar.html'
	# if action == "explain2":
	# 	pubSpeaker.publish("canta_comigo")

    acciones.Songs(action=action)
    acciones.Reproduction(action=action)
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)
    acciones.emotions(action=action)
    
    templateData = {
		'title' : 'A4',
	}
    return render_template(template, **templateData)


############################################
################## Act 5 ###################
############################################
@app.route("/Activities/A5/<action>")
def actionL2_A5(action):
    template = 'Act5_cuenNarra.html'
	# if action == "explain":
	# 	pubSpeaker.publish("escutar_historia")		

    acciones.Stories(action=action)
    acciones.Reproduction(action=action)
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)
    acciones.emotions(action=action)

    templateData = {
		'title' : 'A5',
	}
    return render_template(template, **templateData)

##############################################
############# Act6 Conversacion ##############
##############################################
@app.route("/Activities/A6/<action>")
def Conversacion(action):
    template = "Conversation.html"
    #Bodyparts
    acciones.BodyParts(action=action)
    acciones.emotions(action=action)
	#CastorEmotions
    acciones.CastorEmotions(action=action)
	# #Maths
    acciones.Maths(action=action)
	# #Conversation
    acciones.Conversation(action=action)
    acciones.Frases_objetivo_alcanzado(action=action)
    acciones.Frases_de_incentivo(action=action)

    templateData = {
		'title' : 'Conversation Menu',
	}
    return render_template(template, **templateData)
	
###########################################
################ A7 Action_Hug ############
###########################################
@app.route("/Activities/A7/<action>")
def Hug(action):
    template = "ActivitiesHug.html"
    
    acciones.Hugs(action=action)
    
    templateData = {
		'title' : 'Abrazos',
	}
    return render_template(template, **templateData)

###########################################
############ Pseudoprogramacion ###########
###########################################

@app.route('/get_activities', methods=['POST'])
def get():
    activities_paths = get_activities()
    return jsonify({'status': 'success', 'activities': activities_paths})

###########################################
############ Texto Interactivo ############
###########################################

# @app.route('/get_text')
# def get_text():
#     global text
#     return jsonify({"text": text})

@app.route('/submit_text', methods=['POST'])
def submit_text():
    #current_time = datetime.now().strftime('%H:%M:%S')
    input_text = request.form['input_text']
    #pubText.publish("input_text")
    return jsonify({'status': 'success', 'input_text': input_text})

@app.route('/submit_audio', methods=['POST'])
def submit_audio():
    #current_time = datetime.now().strftime('%H:%M:%S')
    input_audio = request.form['input_audio']
    #pubAudio.publish("input_audio")
    return jsonify({'status': 'success', 'input_text': input_audio})

###########################################
############ Game Serious Menu ############
###########################################
@app.route('/game_menu')
def game_menu():
     return render_template('gameMenu_Chile.html')

@app.route('/play_audio', methods=['POST'])
def play_audio():
    data = request.get_json()
    audio_file = data.get('audio', '')
    
    if audio_file:
        # Publica el archivo de sonido al nodo ROS
        print(audio_file)
        #pubSpeaker.publish(audio_file)
        return jsonify({"status": "success", "audio_file": audio_file})
    
    else:
        return jsonify({"status": "error", "message": "No audio file provided"}), 400

###########################################
############ Game Serious 1 ###############
###########################################
@app.route('/game_atac', methods=['GET', 'POST'])
def game():
    template = 'game_atencion_activa_Chile.html'

    if request.method == 'POST':
        action = request.form.get('action')
        level = request.form.get('level', 'basic')
        if action == 'button_pressed':
            # Aquí puedes hacer lo que desees cuando se presiona el botón
            print("juego_1.mp3")
            #pubSpeaker.publish("juego_1.mp3")
        return redirect(url_for('game', level=level))
    
    level = request.args.get('level', 'basic')
    return render_template(template, level=level)

@app.route('/demo_game')
def demo_game():
    return render_template('demo_game.html', title='Atencion Activa')

@app.route('/results_atac')
def results():
    score = request.args.get('score', 0)
    return render_template('results_atencion_activa.html', score=score)

@app.route('/save_game_metrics', methods=['POST'])
def save_game_metrics():
    """Endpoint para guardar las métricas del juego en la base de datos"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validar que los datos requeridos estén presentes
        required_fields = ['playerName', 'level', 'hits', 'errors', 'score', 'gameDuration', 'avgResponseTime']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Faltan datos requeridos: {missing_fields}'}), 400
        
        try:
            # Crear nueva sesión de juego
            game_session = GameSession(
                player_name=str(data.get('playerName', 'Unknown')),
                session_name=str(data.get('sessionName', 'Unknown')),
                game_name=str(data.get('gameName', 'Unknown')),
                game_level=str(data.get('gameLevel', data.get('level', 'Unknown'))),
                hits=int(data.get('hits', 0)),
                errors=int(data.get('errors', 0)),
                score=int(data.get('score', 0)),
                game_duration=float(data.get('gameDuration', 0)),
                avg_response_time=float(data.get('avgResponseTime', 0))
            )
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'Tipo de dato inválido: {str(e)}'}), 400
        
        # Guardar respuestas detalladas si están disponibles
        if 'responsesDetail' in data or 'responses' in data:
            responses = data.get('responsesDetail', data.get('responses', []))
            game_session.set_responses_detail(responses)
        
        # Guardar datos de movimiento o métricas personalizadas
        custom_metrics = {}
        if 'movementData' in data:
            custom_metrics = data.get('movementData', {})
        
        # Capturar métricas personalizadas de Game 3 (Memory game)
        if 'first_card_time' in data or 'efficiency_percent' in data:
            custom_metrics = {
                'first_card_time': data.get('first_card_time'),
                'total_cards_flipped': data.get('total_cards_flipped'),
                'cards_viewed': data.get('cards_viewed'),
                'pair_times': data.get('pair_times', []),
                'efficiency_percent': data.get('efficiency_percent'),
                'avg_attempts_per_pair': data.get('avg_attempts_per_pair'),
                'avg_search_time': data.get('avg_search_time'),
                'max_win_streak': data.get('max_win_streak'),
                'attempt_history': data.get('attempt_history', [])
            }
        
        # Capturar métricas personalizadas de Game 5 (Detective de Emoções)
        if 'emotionAccuracy' in data or 'reactionAccuracy' in data:
            custom_metrics = {
                'emotionAccuracy': data.get('emotionAccuracy', {}),
                'reactionAccuracy': data.get('reactionAccuracy', {}),
                'responseTimes': data.get('responseTimes', [])
            }
        
        if custom_metrics:
            game_session.set_movement_data(custom_metrics)
        
        # Guardar en la base de datos
        db.session.add(game_session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Métricas guardadas exitosamente',
            'session_id': game_session.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f'Error guardando métricas: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error: {str(e)}'}), 500

@app.route('/get_game_metrics', methods=['GET'])
def get_game_metrics():
    """Endpoint para obtener todas las métricas guardadas (con filtros opcionales)"""
    try:
        player_name = request.args.get('player_name')
        session_name = request.args.get('session_name')
        game_name = request.args.get('game_name')
        
        query = GameSession.query
        
        if player_name:
            query = query.filter_by(player_name=player_name)
        if session_name:
            query = query.filter_by(session_name=session_name)
        if game_name:
            query = query.filter_by(game_name=game_name)
        
        metrics = query.all()
        
        return jsonify({
            'success': True,
            'data': [m.to_dict() for m in metrics]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

###########################################
############ Game Serious 2 ###############
###########################################

@app.route('/game_guardianes', methods=['GET', 'POST'])
def game_guardianes():
    template = 'game_guardianes_Chile.html'
    if request.method == 'POST':
        action = request.form.get('action')
        level = request.form.get('level', 'basic')
        if action == 'button_pressed':
            # Aquí puedes hacer lo que desees cuando se presiona el botón
            print("juego_2.mp3")
            #pubSpeaker.publish("juego_2.mp3")
        return redirect(url_for('game_guardianes', level=level))
    
    level = request.args.get('level', 'basic')
    return render_template(template, level=level)

@app.route('/demo_game2')
def demo_game2():
    return render_template('demo_basico.html', title='Guardianes de la atencion')
###########################################
############ Game Serious 3 ###############
###########################################

@app.route('/game_memoriamagic', methods=['GET', 'POST'])
def game_memoriamagic():
    template = 'game_memoria_magic_Chile.html'
    if request.method == 'POST':
        action = request.form.get('action')
        level = request.form.get('level', 'basic')
        if action == 'button_pressed':
            # Aquí puedes hacer lo que desees cuando se presiona el botón
            print("juego_3.mp3")
            #pubSpeaker.publish("juego_3.mp3")
        return redirect(url_for('game_memoriamagic', level=level))
    
    level = request.args.get('level', 'basic')
    return render_template(template, level=level)

@app.route('/demo_game3')
def demo_game3():
    return render_template('game_memoria_demo.html', title='Guardianes de la atencion')

###########################################
############ Game Serious 4 ###############
###########################################

# Estado inicial del juego (nivel 1)
game_state = {
    'time_left': 180,
    'budget': 60,  # presupuesto nivel 1
    'comida_selected': None,
    'decoracion_selected': None,
    'actividad_selected': None
}

# Costos nivel 1
cost_per_item = {
    'comida1': 20,
    'comida2': 30,  # la que no debería encajar por presupuesto
    'decoracion': 20,
    'actividad': 20
}

correct_items = {
    'comida': 'comida1',
    'decoracion': 'decoracion',
    'actividad': 'actividad'
}

@app.route('/game_planificar', methods=['GET', 'POST'])
def game_planificar():
    global game_state
    game_state = {
    'time_left': 180,
    'budget': 60,  # presupuesto nivel 1
    'comida_selected': None,
    'decoracion_selected': None,
    'actividad_selected': None
    }
    if request.method == 'POST':
        level = request.form.get('level', 'basic')
        action = request.form.get('action')
        if action == 'button_pressed':
            # Aquí puedes hacer lo que desees cuando se presiona el botón
            print("juego_4.mp3")
            #pubSpeaker.publish("juego_4.mp3")
            game_state['instruction'] = True
            return redirect(url_for('game_planificar', level=level))
    level = request.args.get('level', 'basic')
    return render_template('game_planificar_Chile.html',level=level)

@app.route('/select_item', methods=['POST'])
def select_item():
    global game_state
    data = request.get_json()
    item = data.get('item')   # "comida1" | "comida2" | "decoracion" | "actividad"
    slot = data.get('slot')   # "comida"  | "decoracion" | "actividad"

    # Validaciones básicas
    if item not in cost_per_item or slot not in ['comida', 'decoracion', 'actividad']:
        return jsonify({'success': False, 'message': 'Ítem no válido'})

    cost = cost_per_item[item]

    # Flask - select_item corregido
    previous_item = game_state.get(f'{slot}_selected')

    # Solo devolver el costo si realmente se está reemplazando por otro
    if previous_item and previous_item != item:
        game_state['budget'] += cost_per_item[previous_item]

    # Solo cobrar si es un nuevo item (no el mismo que ya está puesto)
    if previous_item != item:
        game_state['budget'] -= cost

    # Guardar selección
    game_state[f'{slot}_selected'] = item

    # ¿Es el correcto para ese slot?
    correct = (correct_items[slot] == item)

    return jsonify({
        'success': True,
        'budget': game_state['budget'],
        'comida_selected':     game_state['comida_selected'],
        'decoracion_selected': game_state['decoracion_selected'],
        'actividad_selected':  game_state['actividad_selected'],
        'correct': correct
    })

@app.route('/remove_item', methods=['POST'])
def remove_item():
    global game_state
    data = request.get_json()
    item = data.get('item')
    slot = data.get('slot')

    if not item or slot not in ['comida', 'decoracion', 'actividad']:
        return jsonify({'success': False, 'message': 'Datos inválidos'})

    # Solo si coincide con lo que estaba en el slot
    if game_state.get(f'{slot}_selected') == item:
        game_state['budget'] += cost_per_item[item]
        game_state[f'{slot}_selected'] = None

    return jsonify({
        'success': True,
        'budget': game_state['budget'],
        'comida_selected':     game_state['comida_selected'],
        'decoracion_selected': game_state['decoracion_selected'],
        'actividad_selected':  game_state['actividad_selected']
    })

@app.route('/status')
def status():
    global game_state
    return jsonify(game_state)

@app.route('/game_planificar_demo')
def game_planificar_demo():
    return render_template('game_planificar_demo.html')
    
###########################################
############ Game Serious 5 ###############
###########################################

@app.route('/game_detectivemotions', methods=['GET', 'POST'])
def game_detectivemotions():
    if request.method == 'POST':
        level = request.form.get('level', 'basic')
        action = request.form.get('action')
        if action == 'button_pressed':
            # Aquí puedes hacer lo que desees cuando se presiona el botón
            print("juego_5.mp3")
            #pubSpeaker.publish("juego_5.mp3")
            return redirect(url_for('game_detectivemotions', level=level))
    level = request.args.get('level', 'basic')    
    return render_template('game_detective_Chile1.html', level = level)


@app.route('/send_emotion', methods=['POST'])
def send_emotion():
    data = request.json
    emotion = data.get('emotion')
    if emotion == 'Feliz':
        #pubEmotions.publish("happy")
        print('happy')
        return jsonify({'status': 'success', 'message': f'Emoción enviada: {emotion}'})
    elif emotion == 'Triste':
        # pubEmotions.publish("sad")
        print('sad')
        return jsonify({'status': 'success', 'message': f'Emoción enviada: {emotion}'})
    elif emotion == 'Enojado':
        # pubEmotions.publish("angry")
        print('angry')
        return jsonify({'status': 'success', 'message': f'Emoción enviada: {emotion}'})
    elif emotion == 'Sorprendido':
        # pubEmotions.publish("surprise")
        print('surprise')
        return jsonify({'status': 'success', 'message': f'Emoción enviada: {emotion}'})

    return jsonify({'status': 'error', 'message': 'Emoción no proporcionada'}), 400

@app.route('/game_detective_demo1')
def game_detective_demo1():
    return render_template('game_detective_level1_demo.html')

if __name__ == "__main__":
   app.run(host='0.0.0.0', port=5000, debug=True)