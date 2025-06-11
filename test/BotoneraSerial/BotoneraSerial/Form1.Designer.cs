namespace BotoneraSerial
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.ComboBox comboBoxPorts;
        private System.Windows.Forms.Button btnConnect;
        private System.Windows.Forms.NumericUpDown numAccion;
        private System.Windows.Forms.Button btnEnviar;
        private System.Windows.Forms.TextBox txtLog;
        private System.Windows.Forms.FlowLayoutPanel panelBotonera;
        private System.Windows.Forms.Button btnCabina1;
        private System.Windows.Forms.Button btnCabina2;
        private System.Windows.Forms.Timer timerPuertos;
        private System.Windows.Forms.TextBox txtTramaSimulada;
        private System.Windows.Forms.Button btnSimularEnvio;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null)) components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Form1));
            comboBoxPorts = new ComboBox();
            btnConnect = new Button();
            numAccion = new NumericUpDown();
            btnEnviar = new Button();
            txtLog = new TextBox();
            panelBotonera = new FlowLayoutPanel();
            btnCabina1 = new Button();
            btnCabina2 = new Button();
            timerPuertos = new System.Windows.Forms.Timer(components);
            txtTramaSimulada = new TextBox();
            btnSimularEnvio = new Button();
            ((System.ComponentModel.ISupportInitialize)numAccion).BeginInit();
            SuspendLayout();
            // 
            // comboBoxPorts
            // 
            comboBoxPorts.FormattingEnabled = true;
            comboBoxPorts.Location = new Point(12, 12);
            comboBoxPorts.Name = "comboBoxPorts";
            comboBoxPorts.Size = new Size(121, 23);
            comboBoxPorts.TabIndex = 20;
            // 
            // btnConnect
            // 
            btnConnect.Location = new Point(139, 10);
            btnConnect.Name = "btnConnect";
            btnConnect.Size = new Size(75, 23);
            btnConnect.TabIndex = 19;
            btnConnect.Text = "Conectar";
            btnConnect.UseVisualStyleBackColor = true;
            btnConnect.Click += btnConnect_Click;
            // 
            // numAccion
            // 
            numAccion.Location = new Point(12, 42);
            numAccion.Maximum = new decimal(new int[] { 97, 0, 0, 0 });
            numAccion.Name = "numAccion";
            numAccion.Size = new Size(120, 23);
            numAccion.TabIndex = 16;
            numAccion.ValueChanged += NumAccion_ValueChanged;
            // 
            // btnEnviar
            // 
            btnEnviar.Location = new Point(139, 42);
            btnEnviar.Name = "btnEnviar";
            btnEnviar.Size = new Size(75, 23);
            btnEnviar.TabIndex = 15;
            btnEnviar.Text = "Enviar Trama";
            btnEnviar.UseVisualStyleBackColor = true;
            btnEnviar.Click += btnEnviar_Click;
            // 
            // txtLog
            // 
            txtLog.Location = new Point(12, 103);
            txtLog.Multiline = true;
            txtLog.Name = "txtLog";
            txtLog.ReadOnly = true;
            txtLog.ScrollBars = ScrollBars.Vertical;
            txtLog.Size = new Size(374, 122);
            txtLog.TabIndex = 14;
            // 
            // panelBotonera
            // 
            panelBotonera.AutoScroll = true;
            panelBotonera.Location = new Point(12, 230);
            panelBotonera.Name = "panelBotonera";
            panelBotonera.Size = new Size(374, 220);
            panelBotonera.TabIndex = 13;
            // 
            // btnCabina1
            // 
            btnCabina1.Location = new Point(230, 10);
            btnCabina1.Name = "btnCabina1";
            btnCabina1.Size = new Size(75, 23);
            btnCabina1.TabIndex = 18;
            btnCabina1.Text = "Cabina 1";
            btnCabina1.UseVisualStyleBackColor = true;
            btnCabina1.Click += btnCabina1_Click;
            // 
            // btnCabina2
            // 
            btnCabina2.Location = new Point(311, 10);
            btnCabina2.Name = "btnCabina2";
            btnCabina2.Size = new Size(75, 23);
            btnCabina2.TabIndex = 17;
            btnCabina2.Text = "Cabina 2";
            btnCabina2.UseVisualStyleBackColor = true;
            btnCabina2.Click += btnCabina2_Click;
            // 
            // txtTramaSimulada
            // 
            txtTramaSimulada.Location = new Point(12, 74);
            txtTramaSimulada.Name = "txtTramaSimulada";
            txtTramaSimulada.ReadOnly = true;
            txtTramaSimulada.Size = new Size(121, 23);
            txtTramaSimulada.TabIndex = 11;
            // 
            // btnSimularEnvio
            // 
            btnSimularEnvio.Location = new Point(139, 74);
            btnSimularEnvio.Name = "btnSimularEnvio";
            btnSimularEnvio.Size = new Size(89, 23);
            btnSimularEnvio.TabIndex = 12;
            btnSimularEnvio.Text = "Simular Envío";
            btnSimularEnvio.UseVisualStyleBackColor = true;
            btnSimularEnvio.Click += btnSimularEnvio_Click;
            // 
            // Form1
            // 
            ClientSize = new Size(400, 460);
            Controls.Add(txtTramaSimulada);
            Controls.Add(btnSimularEnvio);
            Controls.Add(panelBotonera);
            Controls.Add(txtLog);
            Controls.Add(btnEnviar);
            Controls.Add(numAccion);
            Controls.Add(btnCabina2);
            Controls.Add(btnCabina1);
            Controls.Add(btnConnect);
            Controls.Add(comboBoxPorts);
            Icon = (Icon)resources.GetObject("$this.Icon");
            Name = "Form1";
            Text = "Botonera Serial";
            ((System.ComponentModel.ISupportInitialize)numAccion).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }
    }
}
