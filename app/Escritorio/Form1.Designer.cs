namespace SensorMonitor
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;

        private System.Windows.Forms.ComboBox comboBoxSensor;
        private System.Windows.Forms.Button buttonLeer;
        private System.Windows.Forms.Label labelTemp;
        private System.Windows.Forms.TextBox textBoxTemp;
        private System.Windows.Forms.Label labelHum;
        private System.Windows.Forms.TextBox textBoxHum;
        private System.Windows.Forms.RichTextBox richTextBoxDatos;
        private System.Windows.Forms.DataVisualization.Charting.Chart chartDatos;
        private System.Windows.Forms.StatusStrip statusStrip1;
        private System.Windows.Forms.ToolStripStatusLabel toolStripStatusLabel1;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            System.Windows.Forms.DataVisualization.Charting.ChartArea chartArea1 = new System.Windows.Forms.DataVisualization.Charting.ChartArea();
            System.Windows.Forms.DataVisualization.Charting.Series series1 = new System.Windows.Forms.DataVisualization.Charting.Series();
            System.Windows.Forms.DataVisualization.Charting.Series series2 = new System.Windows.Forms.DataVisualization.Charting.Series();
            comboBoxSensor = new ComboBox();
            buttonLeer = new Button();
            labelTemp = new Label();
            textBoxTemp = new TextBox();
            labelHum = new Label();
            textBoxHum = new TextBox();
            richTextBoxDatos = new RichTextBox();
            chartDatos = new System.Windows.Forms.DataVisualization.Charting.Chart();
            statusStrip1 = new StatusStrip();
            toolStripStatusLabel1 = new ToolStripStatusLabel();
            txtComando = new TextBox();
            btnEnviar = new Button();
            ((System.ComponentModel.ISupportInitialize)chartDatos).BeginInit();
            statusStrip1.SuspendLayout();
            SuspendLayout();
            // 
            // comboBoxSensor
            // 
            comboBoxSensor.FormattingEnabled = true;
            comboBoxSensor.Location = new Point(20, 20);
            comboBoxSensor.Name = "comboBoxSensor";
            comboBoxSensor.Size = new Size(200, 23);
            comboBoxSensor.TabIndex = 2;
            // 
            // buttonLeer
            // 
            buttonLeer.Location = new Point(240, 20);
            buttonLeer.Name = "buttonLeer";
            buttonLeer.Size = new Size(100, 23);
            buttonLeer.TabIndex = 3;
            buttonLeer.Text = "Leer Datos";
            buttonLeer.UseVisualStyleBackColor = true;
            // 
            // labelTemp
            // 
            labelTemp.AutoSize = true;
            labelTemp.Location = new Point(20, 60);
            labelTemp.Name = "labelTemp";
            labelTemp.Size = new Size(101, 15);
            labelTemp.TabIndex = 4;
            labelTemp.Text = "Temperatura (°C):";
            // 
            // textBoxTemp
            // 
            textBoxTemp.Location = new Point(140, 60);
            textBoxTemp.Name = "textBoxTemp";
            textBoxTemp.ReadOnly = true;
            textBoxTemp.Size = new Size(100, 23);
            textBoxTemp.TabIndex = 5;
            // 
            // labelHum
            // 
            labelHum.AutoSize = true;
            labelHum.Location = new Point(20, 90);
            labelHum.Name = "labelHum";
            labelHum.Size = new Size(84, 15);
            labelHum.TabIndex = 6;
            labelHum.Text = "Humedad (%):";
            // 
            // textBoxHum
            // 
            textBoxHum.Location = new Point(140, 90);
            textBoxHum.Name = "textBoxHum";
            textBoxHum.ReadOnly = true;
            textBoxHum.Size = new Size(100, 23);
            textBoxHum.TabIndex = 7;
            // 
            // richTextBoxDatos
            // 
            richTextBoxDatos.Location = new Point(20, 130);
            richTextBoxDatos.Name = "richTextBoxDatos";
            richTextBoxDatos.ReadOnly = true;
            richTextBoxDatos.Size = new Size(320, 100);
            richTextBoxDatos.TabIndex = 8;
            richTextBoxDatos.Text = "";
            // 
            // chartDatos
            // 
            chartArea1.Name = "ChartArea1";
            chartDatos.ChartAreas.Add(chartArea1);
            chartDatos.Location = new System.Drawing.Point(360, 20);
            chartDatos.Name = "chartDatos";
            series1.ChartArea = "ChartArea1";
            series1.Legend = "Legend1";
            series1.Name = "Temperatura";
            series2.ChartArea = "ChartArea1";
            series2.Legend = "Legend1";
            series2.Name = "Humedad";
            chartDatos.Series.Add(series1);
            chartDatos.Series.Add(series2);
            chartDatos.Size = new System.Drawing.Size(750, 210);
            this.Controls.Add(chartDatos);
            chartDatos.TabIndex = 9;
            chartDatos.Text = "Gráfica de Sensores";
            // 
            // statusStrip1
            // 
            statusStrip1.Items.AddRange(new ToolStripItem[] { toolStripStatusLabel1 });
            statusStrip1.Location = new Point(0, 281);
            statusStrip1.Name = "statusStrip1";
            statusStrip1.Size = new Size(1139, 22);
            statusStrip1.TabIndex = 10;
            // 
            // toolStripStatusLabel1
            // 
            toolStripStatusLabel1.Name = "toolStripStatusLabel1";
            toolStripStatusLabel1.Size = new Size(73, 17);
            toolStripStatusLabel1.Text = "Estado: Listo";
            // 
            // txtComando
            // 
            txtComando.Location = new Point(20, 240);
            txtComando.MaxLength = 3;
            txtComando.Name = "txtComando";
            txtComando.Size = new Size(100, 23);
            txtComando.TabIndex = 0;
            // 
            // btnEnviar
            // 
            btnEnviar.Location = new Point(140, 240);
            btnEnviar.Name = "btnEnviar";
            btnEnviar.Size = new Size(100, 23);
            btnEnviar.TabIndex = 1;
            btnEnviar.Text = "Enviar Comando";
            btnEnviar.UseVisualStyleBackColor = true;
            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1139, 303);
            Controls.Add(txtComando);
            Controls.Add(btnEnviar);
            Controls.Add(comboBoxSensor);
            Controls.Add(buttonLeer);
            Controls.Add(labelTemp);
            Controls.Add(textBoxTemp);
            Controls.Add(labelHum);
            Controls.Add(textBoxHum);
            Controls.Add(richTextBoxDatos);
            Controls.Add(chartDatos);
            Controls.Add(statusStrip1);
            Name = "Form1";
            Text = "Monitor de Sensores";
            ((System.ComponentModel.ISupportInitialize)chartDatos).EndInit();
            statusStrip1.ResumeLayout(false);
            statusStrip1.PerformLayout();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion
    }
}