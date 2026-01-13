import serial
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import collections
import time

# --- CONFIGURACIÓN ---
PORT = 'COM3'  # Cambia puerto (ej: 'COM3' en Windows)
BAUD_RATE = 115200
BUFFER_SIZE = 50 # Cuántos puntos mostrar en pantalla a la vez

# Inicializar buffers de datos
data_points = collections.deque([0] * BUFFER_SIZE, maxlen=BUFFER_SIZE)
time_points = collections.deque([0] * BUFFER_SIZE, maxlen=BUFFER_SIZE)

# Configurar la conexión Serial
try:
    ser = serial.Serial(PORT, BAUD_RATE, timeout=1)
    print(f"Conectado exitosamente al puerto {PORT}")
except Exception as e:
    print(f"Error al conectar: {e}")
    exit()

# Configurar la gráfica
fig, ax = plt.subplots()
line, = ax.plot(time_points, data_points, color='red', linewidth=2)
ax.set_title("Monitoreo Biométrico en Tiempo Real")
ax.set_xlabel("Tiempo (s)")
ax.set_ylabel("Valor (Pulsaciones/Nivel)")
ax.grid(True)

def update(frame):
    if ser.in_waiting > 0:
        line_data = ser.readline().decode('utf-8', errors='ignore').strip()
        
        # Supongamos que el ESP32 envía los datos como: "DATA:75"
        if "DATA:" in line_data:
            try:
                # Extraer solo el número después de "DATA:"
                value = float(line_data.split(":")[1])
                
                data_points.append(value)
                time_points.append(time.time() % 60) # Segundos actuales para el eje X
                
                # Actualizar datos de la línea
                line.set_data(range(BUFFER_SIZE), data_points)
                
                # Ajustar límites de la gráfica dinámicamente
                ax.set_ylim(min(data_points) - 5, max(data_points) + 5)
                ax.set_xlim(0, BUFFER_SIZE)
                
                print(f"Lectura recibida: {value}")
            except ValueError:
                pass

    return line,

# Iniciar animación
ani = FuncAnimation(fig, update, interval=50, cache_frame_data=False)
plt.show()

# Cerrar puerto al finalizar
ser.close()