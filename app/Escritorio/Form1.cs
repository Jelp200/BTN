using System;
using System.IO.Ports;
using System.Text.Json;
using System.Windows.Forms;
using System.Windows.Forms.DataVisualization.Charting;
using System.Drawing;
using System.Text;
using System.Xml.Linq;

namespace SensorMonitor
{
    public partial class Form1 : Form
    {
        public const string NL = "\r\n";

        // Controles globales
        private ComboBox comboBoxSensor;
        private Button buttonLeer;
        private Label labelTemp;
        private TextBox textBoxTemp;
        private Label labelHum;
        private TextBox textBoxHum;
        private RichTextBox richTextBoxDatos;
        private Chart chartDatos;
        private StatusStrip statusStrip1;
        private ToolStripStatusLabel toolStripStatusLabel1;
        private TextBox txtComando;
        private Button btnEnviar;

        private readonly SerialPort _serialPort = new();
        private StreamWriter _csvWriter;
        private string _csvFilePath;
        private int _points = 0;
        private string _ultimoComando = "";
        private DebugConsole _debugConsole = null!;
        private Random _rnd = new();

        private System.Windows.Forms.Timer _simuladorTimer;
        private int _contadorDatosSimulados = 0;
        private const int MaxDatosSimulados = 20;
        private readonly StringBuilder _keyInput = new();

        public Form1()
        {
            CrearControles();
            CrearBotonesComando();
            InicializarControles();
            InicializarBotonesComando();
            InicializarGrafico(); // Configurar gráfico correctamente
            CargarPuertos();
            InicializarSerial();
            InicializarCSV();

            InicializarSimulador();
            ActivarSimulador(true); // Iniciar simulación automática
            this.ActiveControl = null; // Permitir escucha global de teclas
        }

        private void CrearControles()
        {
            // ComboBox - Puertos COM
            comboBoxSensor = new ComboBox { Location = new Point(20, 20), Width = 200 };
            this.Controls.Add(comboBoxSensor);

            // Botón Leer Datos
            buttonLeer = new Button { Text = "Leer Datos", Location = new Point(240, 20) };
            buttonLeer.Click += ButtonLeer_Click;
            this.Controls.Add(buttonLeer);

            // Etiqueta Temperatura
            labelTemp = new Label { Text = "Temperatura (°C):", Location = new Point(20, 60) };
            this.Controls.Add(labelTemp);

            // TextBox Temperatura
            textBoxTemp = new TextBox { ReadOnly = true, Location = new Point(140, 60), Width = 100 };
            this.Controls.Add(textBoxTemp);

            // Etiqueta Humedad
            labelHum = new Label { Text = "Humedad (%):", Location = new Point(20, 90) };
            this.Controls.Add(labelHum);

            // TextBox Humedad
            textBoxHum = new TextBox { ReadOnly = true, Location = new Point(140, 90), Width = 100 };
            this.Controls.Add(textBoxHum);

            // RichTextBox para datos
            richTextBoxDatos = new RichTextBox
            {
                Location = new Point(20, 130),
                Size = new Size(320, 100),
                ScrollBars = RichTextBoxScrollBars.Vertical,
                ReadOnly = true
            };
            this.Controls.Add(richTextBoxDatos);

            // Gráfico de temperatura/humedad
            chartDatos = new Chart
            {
                Location = new Point(360, 20),
                Size = new Size(750, 210)
            };
            var area = new ChartArea("Principal");
            chartDatos.ChartAreas.Add(area);
            chartDatos.Series.Add(new Series("Temperatura") { ChartType = SeriesChartType.Line });
            chartDatos.Series.Add(new Series("Humedad") { ChartType = SeriesChartType.Line });
            this.Controls.Add(chartDatos);

            // Barra de estado
            statusStrip1 = new StatusStrip();
            toolStripStatusLabel1 = new ToolStripStatusLabel { Text = "Estado: Listo" };
            statusStrip1.Items.Add(toolStripStatusLabel1);
            this.Controls.Add(statusStrip1);

            // Campo de comando
            txtComando = new TextBox { Location = new Point(20, 240), MaxLength = 3 };
            this.Controls.Add(txtComando);

            // Botón Enviar Comando
            btnEnviar = new Button { Text = "Enviar Comando", Location = new Point(140, 240) };
            btnEnviar.Click += BtnEnviar_Click;
            this.Controls.Add(btnEnviar);

            // Configuración final de la ventana
            this.ClientSize = new Size(1920, 1080);
            this.Text = "Monitor de Sensores";
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.MaximizeBox = true;
        }

        private void CrearBotonesComando()
        {
            int x = 20;
            int y = 270;
            for (int i = 0; i < 10; i++)
            {
                string cmdStr = i.ToString("D3");
                var btn = new Button
                {
                    Text = $"Cmd {cmdStr}",
                    Width = 100,
                    Height = 30,
                    Location = new Point(x, y),
                    Tag = cmdStr
                };
                btn.Click += BotonComando_Click;
                Controls.Add(btn);
                y += 35;
            }
        }


        private void InicializarBotonesComando()
        {
            int x = 20;
            int y = 270;

            for (int i = 0; i < 10; i++)
            {
                string cmdStr = i.ToString("D3"); // Ej: 000, 001, ..., 009
                var btn = new Button
                {
                    Text = $"Cmd {cmdStr}",
                    Width = 100,
                    Height = 30,
                    Location = new Point(x, y),
                    Tag = cmdStr
                };
                btn.Click += BotonComando_Click;
                this.Controls.Add(btn);
                y += 35;
            }
        }

        private void InicializarControles()
        {
            // Asociar eventos
            btnEnviar.Click += BtnEnviar_Click;
        }

        private void InicializarGrafico()
        {
            chartDatos.ChartAreas.Clear();
            chartDatos.Series.Clear();

            var area = new ChartArea("Principal")
            {
                AxisY =
                {
                    LabelStyle =
                    {
                        Format = "{0}°C / %",
                        Font = new Font("Segoe UI", 8)
                    },
                    MajorGrid =
                    {
                        LineColor = Color.LightGray
                    }
                }
            };

            area.AxisX.LabelStyle.Enabled = false;
            area.AxisX.MajorGrid.Enabled = false;

            chartDatos.ChartAreas.Add(area);

            var serieTemperatura = new Series("Temperatura")
            {
                ChartType = SeriesChartType.Line,
                BorderWidth = 2,
                Color = Color.Red,
                MarkerStyle = MarkerStyle.Circle,
                MarkerSize = 5,
                XValueType = ChartValueType.Int32,
                YValueType = ChartValueType.Int32
            };
            chartDatos.Series.Add(serieTemperatura);

            var serieHumedad = new Series("Humedad")
            {
                ChartType = SeriesChartType.Line,
                BorderWidth = 2,
                Color = Color.Blue,
                MarkerStyle = MarkerStyle.Diamond,
                MarkerSize = 5,
                XValueType = ChartValueType.Int32,
                YValueType = ChartValueType.Int32
            };
            chartDatos.Series.Add(serieHumedad);
        }

        private void InicializarSimulador()
        {
            _simuladorTimer = new System.Windows.Forms.Timer();
            _simuladorTimer.Interval = 1000; // 1 segundo
            _simuladorTimer.Tick += SimuladorTimer_Tick;
        }

        private void ActivarSimulador(bool activar)
        {
            if (activar)
                _simuladorTimer.Start();
            else
                _simuladorTimer.Stop();
        }

        private void SimuladorTimer_Tick(object? sender, EventArgs e)
        {
            if (_contadorDatosSimulados >= MaxDatosSimulados)
            {
                _simuladorTimer.Stop();
                MostrarMensaje("✅ Se alcanzó el límite de datos simulados.", ColorType.Success);
                return;
            }

            int humedad = _rnd.Next(40, 80);
            int temp = _rnd.Next(15, 35);
            double voltageHum = Math.Round((humedad * 3.3 / 100.0) * 100.0) / 100.0;
            double voltageTemp = Math.Round((temp * 3.3 / 100.0) * 100.0) / 100.0;

            string jsonFalso = $"{{\"humedad\":\"{humedad}%\",\"voltage_humedad\":\"{voltageHum:F2}V\",\"temperatura\":\"{temp}C\",\"voltage_temp\":\"{voltageTemp:F2}V\"}}{NL}";
            ProcesarDatos(jsonFalso);

            _contadorDatosSimulados++;
        }

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            // Detectar ALT + 2 + D
            if ((keyData & Keys.Alt) == Keys.Alt &&
                (keyData & Keys.D2) == Keys.D2 &&
                (keyData & Keys.D) == Keys.D)
            {
                ToggleDebugConsole();
                return true;
            }

            // Detectar "consola"
            if (keyData >= Keys.A && keyData <= Keys.Z ||
                keyData >= Keys.D0 && keyData <= Keys.D9 ||
                keyData >= Keys.NumPad0 && keyData <= Keys.NumPad9)
            {
                char keyChar = (char)keyData;
                _keyInput.Append(keyChar);

                if (_keyInput.Length > 7)
                    _keyInput.Remove(0, 1);

                if (_keyInput.ToString().Equals("consola", StringComparison.CurrentCultureIgnoreCase))
                {
                    ToggleDebugConsole();
                    _keyInput.Clear();
                    return true;
                }
            }

            return base.ProcessCmdKey(ref msg, keyData);
        }

        private void ToggleDebugConsole()
        {
            if (_debugConsole == null || _debugConsole.IsDisposed)
            {
                _debugConsole = DebugConsole.GetInstance();
                _debugConsole.FormClosed += (s, e) => _debugConsole = null;
                _debugConsole.Show(this);
                _debugConsole.Log("✅ Consola de depuración activada.");
            }
            else
            {
                _debugConsole.Hide();
                _debugConsole.Dispose();
                _debugConsole = null;
            }
        }

        private void CargarPuertos()
        {
            comboBoxSensor.Items.Clear();
            foreach (string port in SerialPort.GetPortNames())
                comboBoxSensor.Items.Add(port);
        }

        private void InicializarSerial()
        {
            _serialPort.BaudRate = 9600;
            _serialPort.Parity = Parity.None;
            _serialPort.StopBits = StopBits.One;
            _serialPort.DataBits = 8;
            _serialPort.ReadTimeout = 1000;
            _serialPort.DataReceived += DataReceivedHandler;
        }

        private void InicializarCSV()
        {
            _csvFilePath = Path.Combine(Application.StartupPath, "lecturas.csv");
            _csvWriter = new StreamWriter(_csvFilePath, false);
            _csvWriter.WriteLine("Fecha,Hora,Temperatura,Humedad");
            _csvWriter.Flush();
        }

        private void ButtonLeer_Click(object sender, EventArgs e)
        {
            if (comboBoxSensor.SelectedItem == null)
            {
                MostrarMensaje("❌ Error: Seleccione un puerto COM.", ColorType.Error);
                return;
            }

            try
            {
                _serialPort.PortName = comboBoxSensor.SelectedItem.ToString();
                _serialPort.Open();
                ActualizarEstado("✔️ Conectado a " + _serialPort.PortName);
            }
            catch (Exception ex)
            {
                MostrarMensaje($"❌ Error al conectar: {ex.Message}", ColorType.Error);
            }

        }

        private void BtnEnviar_Click(object? sender, EventArgs e)
        {
            string input = txtComando.Text.Trim();

            _debugConsole?.Log($"🔍 Iniciando validación del comando: {input}");

            if (input.Length != 3 || !int.TryParse(input, out int cmdNumber))
            {
                _debugConsole?.Log("❌ Error: El comando debe tener 3 dígitos.");
                MostrarMensaje("❌ Error: Debe ingresar exactamente 3 dígitos.", ColorType.Error);
                return;
            }

            if (cmdNumber < 0 || cmdNumber > 78)
            {
                _debugConsole?.Log($"❌ Error: Número fuera de rango: {cmdNumber}");
                MostrarMensaje("❌ Error: El número debe estar entre 000 y 078.", ColorType.Error);
                return;
            }

            string trama = $"C1{input}F{NL}";
            string ackCmd = $"ACK{input}{NL}";

            // Si el puerto está abierto, envía por UART
            if (_serialPort.IsOpen)
            {
                try
                {
                    _serialPort.Write(trama);
                    _ultimoComando = input;
                    MostrarMensaje($"✅ Enviado: {trama}", ColorType.Success);
                    _debugConsole?.Log($"📩 Comando enviado: {trama}");
                }
                catch (Exception ex)
                {
                    MostrarMensaje($"❌ Error al enviar por UART: {ex.Message}", ColorType.Error);
                    _debugConsole?.Log($"❗ Error al enviar por UART: {ex.Message}");
                }
            }
            else
            {
                // Simular envío y recepción
                MostrarMensaje($"⚠️ Puerto cerrado - Trama generada: {trama}", ColorType.Warning);
                _debugConsole?.Log($"📡 Puerto cerrado - Se generó trama: {trama}");

                // Simula la recepción del ACK
                ProcesarDatos(ackCmd); // Esto mostrará el ACK como si viniera del uC
            }
        }

        private void BotonComando_Click(object sender, EventArgs e)
        {
            if (sender is Button boton && boton.Tag is string cmdStr)
            {
                string trama = $"C1{cmdStr}F{NL}";

                _ultimoComando = cmdStr;

                if (_serialPort.IsOpen)
                {
                    try
                    {
                        _serialPort.Write(trama);
                        MostrarMensaje($"✅ Enviado: {trama}", ColorType.Success);
                        _debugConsole?.Log($"📩 Trama enviada: {trama}");
                    }
                    catch (Exception ex)
                    {
                        MostrarMensaje($"❌ Error al enviar: {ex.Message}", ColorType.Error);
                    }
                }
                else
                {
                    // Simular recepción de ACK
                    string ackSimulado = $"ACK{cmdStr}{NL}";
                    ProcesarDatos(ackSimulado);

                    // Simular datos JSON asociados (opcional)
                    int temp = _rnd.Next(15, 35);
                    int hum = _rnd.Next(40, 80);
                    string jsonSimulado = $"{{\"humedad\":\"{hum}%\",\"voltage_humedad\":\"{hum * 0.033:F2}V\",\"temperatura\":\"{temp}C\",\"voltage_temp\":\"{temp * 0.033:F2}V\"}}{NL}";
                    ProcesarDatos(jsonSimulado);

                    MostrarMensaje($"⚠️ Puerto cerrado - Simulando envío: {trama}", ColorType.Warning);
                    _debugConsole?.Log($"📡 Puerto cerrado - Simulando trama: {trama}");
                }
            }
        }

        private void DataReceivedHandler(object sender, SerialDataReceivedEventArgs e)
        {
            string data = _serialPort.ReadExisting();
            _debugConsole?.Log($"📡 Recibido raw: {data}");
            this.Invoke(new Action(() => ProcesarDatos(data)));
        }

        private void ProcesarDatos(string data)
        {
            richTextBoxDatos.AppendText(data + NL);
            richTextBoxDatos.ScrollToCaret();
            _debugConsole?.Log($"📥 Datos recibidos: {data}");

            // Buscar ACK
            if (data.Contains("ACK"))
            {
                string ackCmd = data.Substring(data.IndexOf("ACK") + 3, 3);
                _debugConsole?.Log($"✅ ACK recibido para comando: {ackCmd}");
                if (ackCmd == _ultimoComando)
                    ActualizarEstado($"✔️ Comando {_ultimoComando} ejecutado.");
            }

            // Procesar JSON (si viene)
            int start = data.IndexOf('{');
            int end = data.IndexOf('}');
            if (start >= 0 && end > start)
            {
                string json = data.Substring(start, end - start + 1);
                try
                {
                    var sensorData = JsonSerializer.Deserialize<SensorData>(json);

                    textBoxTemp.Text = sensorData.temperatura;
                    textBoxHum.Text = sensorData.humedad;

                    int tempVal = int.Parse(sensorData.temperatura.Replace("C", ""));
                    int humVal = int.Parse(sensorData.humedad.Replace("%", ""));

                    chartDatos.Series["Temperatura"].Points.AddXY(_points++, tempVal);
                    chartDatos.Series["Humedad"].Points.AddXY(_points - 1, humVal);

                    if (chartDatos.Series["Temperatura"].Points.Count > 50)
                        chartDatos.Series["Temperatura"].Points.RemoveAt(0);
                    if (chartDatos.Series["Humedad"].Points.Count > 50)
                        chartDatos.Series["Humedad"].Points.RemoveAt(0);

                    string fecha = DateTime.Now.ToString("yyyy-MM-dd");
                    string hora = DateTime.Now.ToString("HH:mm:ss");

                    _csvWriter.WriteLine($"{fecha},{hora},{sensorData.temperatura},{sensorData.humedad}");
                    _csvWriter.Flush();
                }
                catch (Exception ex)
                {
                    _debugConsole?.Log($"❗ Error al procesar JSON: {ex.Message}");
                    ActualizarEstado("❌ Error al procesar JSON: " + ex.Message);
                }
            }
        }

        private void ActualizarEstado(string mensaje)
        {
            toolStripStatusLabel1.Text = mensaje;
        }

        private void MostrarMensaje(string mensaje, ColorType tipo)
        {
            switch (tipo)
            {
                case ColorType.Success:
                    richTextBoxDatos.SelectionColor = Color.Green;
                    break;
                case ColorType.Warning:
                    richTextBoxDatos.SelectionColor = Color.Goldenrod;
                    break;
                case ColorType.Error:
                    richTextBoxDatos.SelectionColor = Color.Red;
                    break;
                default:
                    richTextBoxDatos.SelectionColor = Color.Black;
                    break;
            }

            richTextBoxDatos.AppendText(mensaje + NL);
            richTextBoxDatos.SelectionColor = Color.Black;
            richTextBoxDatos.ScrollToCaret();
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            if (_serialPort.IsOpen) _serialPort.Close();
            _csvWriter?.Dispose();
            base.OnFormClosed(e);
        }
    }

    public enum ColorType
    {
        Default,
        Success,
        Warning,
        Error
    }

    public class SensorData
    {
        public required string humedad { get; set; }
        public required string voltage_humedad { get; set; }
        public required string temperatura { get; set; }
        public required string voltage_temp { get; set; }
    }
}