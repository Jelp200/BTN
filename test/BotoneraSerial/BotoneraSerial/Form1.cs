using System;
using System.IO.Ports;
using System.Linq;
using System.Drawing;
using System.Windows.Forms;

namespace BotoneraSerial
{
    public partial class Form1 : Form
    {
        private SerialPort serialPort;
        private string[] puertosPrevios = new string[0];
        private string cabinaActual = "C1";

        public Form1()
        {
            InitializeComponent();
            CargarPuertos();
            CrearTecladoVirtual();

            timerPuertos.Interval = 2000;
            timerPuertos.Tick += TimerPuertos_Tick;
            timerPuertos.Start();
        }

        private void NumAccion_ValueChanged(object sender, EventArgs e)
        {
            ActualizarTramaSimulada();
        }

        private void CargarPuertos()
        {
            comboBoxPorts.Items.Clear();
            comboBoxPorts.Items.AddRange(SerialPort.GetPortNames());
            if (comboBoxPorts.Items.Count > 0)
                comboBoxPorts.SelectedIndex = 0;
        }

        private void TimerPuertos_Tick(object sender, EventArgs e)
        {
            string[] puertosActuales = SerialPort.GetPortNames();
            if (!puertosPrevios.SequenceEqual(puertosActuales))
            {
                puertosPrevios = puertosActuales;
                comboBoxPorts.Items.Clear();
                comboBoxPorts.Items.AddRange(puertosActuales);
                if (puertosActuales.Length > 0)
                    comboBoxPorts.SelectedIndex = 0;
                Log("Puertos COM actualizados.");
            }
        }

        private string GenerarTrama()
        {
            string accionStr = ((int)numAccion.Value).ToString("D3");
            return $"{cabinaActual}{accionStr}F";
        }

        private void ActualizarTramaSimulada()
        {
            string trama = GenerarTrama();
            txtTramaSimulada.Text = trama;
            Log($"[Simulado] Trama actualizada: {trama}");
        }

        private void btnConnect_Click(object sender, EventArgs e)
        {
            try
            {
                if (serialPort != null && serialPort.IsOpen)
                {
                    serialPort.Close();
                    btnConnect.Text = "Conectar";
                    Log("Puerto cerrado.");
                }
                else
                {
                    string portName = comboBoxPorts.SelectedItem?.ToString();
                    if (string.IsNullOrEmpty(portName)) return;

                    serialPort = new SerialPort(portName, 9600);
                    serialPort.Open();
                    btnConnect.Text = "Desconectar";
                    Log($"Conectado a {portName}");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al abrir el puerto: " + ex.Message);
            }
        }

        private void btnCabina1_Click(object sender, EventArgs e)
        {
            cabinaActual = "C1";
            btnCabina1.BackColor = Color.LightGreen;
            btnCabina2.BackColor = SystemColors.Control;
            Log("Cabina seleccionada: C1");
            ActualizarTramaSimulada();
        }

        private void btnCabina2_Click(object sender, EventArgs e)
        {
            cabinaActual = "C2";
            btnCabina2.BackColor = Color.LightGreen;
            btnCabina1.BackColor = SystemColors.Control;
            Log("Cabina seleccionada: C2");
            ActualizarTramaSimulada();
        }

        private void btnSimularEnvio_Click(object sender, EventArgs e)
        {
            string trama = GenerarTrama();
            txtTramaSimulada.Text = trama;
            Log($"[Simulado] Trama generada: {trama}");
        }

        private void btnEnviar_Click(object sender, EventArgs e)
        {
            if (serialPort == null || !serialPort.IsOpen)
            {
                MessageBox.Show("Puerto no conectado.");
                return;
            }

            string accionStr = ((int)numAccion.Value).ToString("D3");
            string trama = $"{cabinaActual}{accionStr}F";

            try
            {
                serialPort.WriteLine(trama);
                Log($"Trama enviada: {trama}");
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al enviar trama: " + ex.Message);
            }
        }

        private void CrearTecladoVirtual()
        {
            for (int i = 0; i <= 97; i++)
            {
                Button btn = new Button();
                btn.Text = i.ToString("D3");
                btn.Width = 60;
                btn.Height = 40;
                btn.Margin = new Padding(3);
                btn.Tag = i;
                btn.Click += BotonVirtual_Click;
                panelBotonera.Controls.Add(btn);
            }
        }

        private void BotonVirtual_Click(object sender, EventArgs e)
        {
            int accion = (int)((Button)sender).Tag;
            numAccion.Value = accion; // Esto activará el evento ValueChanged

            // Forzamos actualización si no se disparó por ValueChanged
            ActualizarTramaSimulada();

            if (serialPort == null || !serialPort.IsOpen)
            {
                MessageBox.Show("Puerto no conectado. Solo se mostró la trama.");
                return;
            }

            string accionStr = accion.ToString("D3");
            string trama = $"{cabinaActual}{accionStr}F";

            try
            {
                serialPort.WriteLine(trama);
                Log($"[Real] Trama enviada: {trama}");
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error al enviar trama: " + ex.Message);
            }
        }

        private void Log(string mensaje)
        {
            txtLog.AppendText($"{DateTime.Now:HH:mm:ss} - {mensaje}{Environment.NewLine}");
            txtLog.ScrollToCaret();
        }
    }
}
