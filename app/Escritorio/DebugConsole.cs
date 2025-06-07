using System;
using System.Windows.Forms;

namespace SensorMonitor
{
    public partial class DebugConsole : Form
    {
        private static DebugConsole _instance;
        private RichTextBox _consoleBox;

        private DebugConsole()
        {
            InitializeComponent();
            InitializeConsole();
        }

        public static DebugConsole GetInstance()
        {
            return _instance ??= new DebugConsole();
        }

        private void InitializeComponent()
        {
            this.SuspendLayout();
            this.AutoScaleDimensions = new SizeF(7F, 15F);
            this.AutoScaleMode = AutoScaleMode.Font;
            this.ClientSize = new Size(600, 400);
            this.Text = "Consola de Depuración";
            this.ResumeLayout(false);
        }

        private void InitializeConsole()
        {
            _consoleBox = new RichTextBox
            {
                Dock = DockStyle.Fill,
                ReadOnly = true,
                ScrollBars = RichTextBoxScrollBars.Vertical,
                Font = new Font("Consolas", 9)
            };

            this.Controls.Add(_consoleBox);
        }

        public void Log(string mensaje)
        {
            if (_consoleBox == null || _consoleBox.IsDisposed)
                return;

            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string>(Log), mensaje);
            }
            else
            {
                _consoleBox.AppendText($"[DEBUG] {DateTime.Now:HH:mm:ss} - {mensaje}{Form1.NL}");
                _consoleBox.ScrollToCaret();
            }
        }

        public void Clear()
        {
            _consoleBox?.Clear();
        }
    }
}