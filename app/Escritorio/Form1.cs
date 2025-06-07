using System;
using System.IO;
using System.IO.Ports;
using System.Text;
using System.Text.Json;
using System.Drawing;
using System.Windows.Forms;
using System.Windows.Forms.DataVisualization.Charting;

namespace SensorMonitor
{
    public partial class Form1 : Form
    {
        internal const string NL = "\r\n";

        private System.Windows.Forms.Timer _simuladorTimer;
        private Random _rnd = new();
        private int _contadorDatosSimulados = 0;
        private const int MaxDatosSimulados = 50;
        private readonly SerialPort _serialPort = new();
        private StreamWriter _csvWriter = null!;
        private string _csvFilePath = null!;
        private int _points = 0;
        private string _ultimoComando = "";

        // Controles declarados manualmente
        private TextBox txtComando = null!;
        private Button btnEnviar = null!;
        private DebugConsole? _debugConsole = null;
        private readonly StringBuilder _keyInput = new();

        public Form1()
        {
            InitializeComponent();
            InicializarControles();
            InicializarGrafico(); // Configurar gráfico correctamente
            CargarPuertos();
            InicializarSerial();
            InicializarCSV();

            InicializarSimulador();
            ActivarSimulador(true); // Iniciar simulación automática
            this.ActiveControl = null; // Permitir escucha global de teclas
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

            if (input.Length != 3 || !int.TryParse(input, out int cmdNumber))
            {
                MostrarMensaje("❌ Error: Debe ingresar exactamente 3 dígitos.", ColorType.Error);
                return;
            }

            if (cmdNumber < 0 || cmdNumber > 78)
            {
                MostrarMensaje("❌ Error: El número debe estar entre 000 y 078.", ColorType.Error);
                return;
            }

            string trama = $"C1{input}F{NL}";

            if (_serialPort.IsOpen)
            {
                _serialPort.Write(trama);
                _ultimoComando = input;
                MostrarMensaje($"✅ Enviado: {trama}", ColorType.Success);
                _debugConsole?.Log($"📩 Comando enviado: {trama}");
            }
            else
            {
                MostrarMensaje("⚠️ Puerto cerrado: No se pudo enviar el comando.", ColorType.Warning);
                _debugConsole?.Log("⚠️ Puerto cerrado al intentar enviar comando.");
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

            if (data.Contains("ACK"))
            {
                string ackCmd = data.Substring(data.IndexOf("ACK") + 3, 3);
                if (ackCmd == _ultimoComando)
                    ActualizarEstado($"✔️ Comando {_ultimoComando} ejecutado.");
            }

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