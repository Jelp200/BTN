using System;
using System.Drawing;
using System.Windows.Forms;
using System.Windows.Forms.DataVisualization.Charting;

public class Form1 : Form
{
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
    private Panel leftPanel;

    public Form1()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        ChartArea chartArea1 = new ChartArea();
        Series series1 = new Series();
        Series series2 = new Series();
        leftPanel = new Panel();
        btnEnviar = new Button();
        txtComando = new TextBox();
        labelHum = new Label();
        textBoxHum = new TextBox();
        labelTemp = new Label();
        textBoxTemp = new TextBox();
        buttonLeer = new Button();
        comboBoxSensor = new ComboBox();
        richTextBoxDatos = new RichTextBox();
        chartDatos = new Chart();
        statusStrip1 = new StatusStrip();
        toolStripStatusLabel1 = new ToolStripStatusLabel();
        leftPanel.SuspendLayout();
        ((System.ComponentModel.ISupportInitialize)chartDatos).BeginInit();
        statusStrip1.SuspendLayout();
        SuspendLayout();
        // 
        // leftPanel
        // 
        // Panel izquierdo con scroll
        leftPanel = new Panel
        {
            Dock = DockStyle.Left,
            Width = 400,
            AutoScroll = true,
            Padding = new Padding(10)
        };

        // Tabla para organizar en 2 columnas
        TableLayoutPanel botonesTabla = new TableLayoutPanel
        {
            ColumnCount = 2,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            Dock = DockStyle.Top
        };

        // Fijamos ancho relativo de cada columna
        botonesTabla.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50F));
        botonesTabla.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50F));

        // Agrega controles generales (sensor, temp, etc.)
        botonesTabla.Controls.Add(comboBoxSensor, 0, 0);
        botonesTabla.SetColumnSpan(comboBoxSensor, 2);

        botonesTabla.Controls.Add(buttonLeer, 0, 1);
        botonesTabla.SetColumnSpan(buttonLeer, 2);

        botonesTabla.Controls.Add(labelTemp, 0, 2);
        botonesTabla.Controls.Add(textBoxTemp, 1, 2);

        botonesTabla.Controls.Add(labelHum, 0, 3);
        botonesTabla.Controls.Add(textBoxHum, 1, 3);

        // Agrega botones de comando en múltiples filas
        int fila = 4;
        for (int i = 0; i < 10; i++)
        {
            Button btn = new Button
            {
                Text = $"Comando {i + 1}",
                Dock = DockStyle.Fill,
                Height = 30,
                Tag = $"CMD{i + 1}"
            };
            btn.Click += BotonComando_Click;
            int col = i % 2;
            if (col == 0) botonesTabla.RowCount++;
            botonesTabla.Controls.Add(btn, col, fila + i / 2);
        }

        // Comando y richtextbox
        int siguienteFila = fila + (int)Math.Ceiling(10 / 2.0);
        botonesTabla.Controls.Add(txtComando, 0, siguienteFila);
        botonesTabla.Controls.Add(btnEnviar, 1, siguienteFila);
        botonesTabla.Controls.Add(richTextBoxDatos, 0, siguienteFila + 1);
        botonesTabla.SetColumnSpan(richTextBoxDatos, 2);

        // Agrega la tabla al panel con scroll
        leftPanel.Controls.Add(botonesTabla);

        // 
        // btnEnviar
        // 
        btnEnviar.Location = new Point(0, 0);
        btnEnviar.Name = "btnEnviar";
        btnEnviar.Size = new Size(75, 23);
        btnEnviar.TabIndex = 0;
        // 
        // txtComando
        // 
        txtComando.Location = new Point(0, 0);
        txtComando.Name = "txtComando";
        txtComando.Size = new Size(100, 23);
        txtComando.TabIndex = 1;
        // 
        // labelHum
        // 
        labelHum.Location = new Point(0, 0);
        labelHum.Name = "labelHum";
        labelHum.Size = new Size(100, 23);
        labelHum.TabIndex = 2;
        // 
        // textBoxHum
        // 
        textBoxHum.Location = new Point(0, 0);
        textBoxHum.Name = "textBoxHum";
        textBoxHum.Size = new Size(100, 23);
        textBoxHum.TabIndex = 3;
        // 
        // labelTemp
        // 
        labelTemp.Location = new Point(0, 0);
        labelTemp.Name = "labelTemp";
        labelTemp.Size = new Size(100, 23);
        labelTemp.TabIndex = 4;
        // 
        // textBoxTemp
        // 
        textBoxTemp.Location = new Point(0, 0);
        textBoxTemp.Name = "textBoxTemp";
        textBoxTemp.Size = new Size(100, 23);
        textBoxTemp.TabIndex = 5;
        // 
        // buttonLeer
        // 
        buttonLeer.Location = new Point(0, 0);
        buttonLeer.Name = "buttonLeer";
        buttonLeer.Size = new Size(75, 23);
        buttonLeer.TabIndex = 6;
        // 
        // comboBoxSensor
        // 
        comboBoxSensor.Location = new Point(0, 0);
        comboBoxSensor.Name = "comboBoxSensor";
        comboBoxSensor.Size = new Size(121, 23);
        comboBoxSensor.TabIndex = 7;
        // 
        // richTextBoxDatos
        // 
        richTextBoxDatos.Location = new Point(0, 0);
        richTextBoxDatos.Name = "richTextBoxDatos";
        richTextBoxDatos.Size = new Size(100, 96);
        richTextBoxDatos.TabIndex = 8;
        richTextBoxDatos.Text = "";
        // 
        // chartDatos
        // 
        chartArea1.Name = "ChartArea1";
        chartDatos.ChartAreas.Add(chartArea1);
        chartDatos.Location = new Point(0, 0);
        chartDatos.Name = "chartDatos";
        series1.ChartArea = "ChartArea1";
        series1.Name = "Temperatura";
        series2.ChartArea = "ChartArea1";
        series2.Name = "Humedad";
        chartDatos.Series.Add(series1);
        chartDatos.Series.Add(series2);
        chartDatos.Size = new Size(300, 300);
        chartDatos.TabIndex = 0;
        // 
        // statusStrip1
        // 
        statusStrip1.Items.AddRange(new ToolStripItem[] { toolStripStatusLabel1 });
        statusStrip1.Location = new Point(0, 531);
        statusStrip1.Name = "statusStrip1";
        statusStrip1.Size = new Size(1089, 22);
        statusStrip1.TabIndex = 2;
        // 
        // toolStripStatusLabel1
        // 
        toolStripStatusLabel1.Name = "toolStripStatusLabel1";
        toolStripStatusLabel1.Size = new Size(0, 17);
        // 
        // Form1
        // 
        ClientSize = new Size(1089, 553);
        Controls.Add(chartDatos);
        Controls.Add(leftPanel);
        Controls.Add(statusStrip1);
        Name = "Form1";
        Text = "Monitor de Sensores";
        WindowState = FormWindowState.Maximized;
        leftPanel.ResumeLayout(false);
        leftPanel.PerformLayout();
        ((System.ComponentModel.ISupportInitialize)chartDatos).EndInit();
        statusStrip1.ResumeLayout(false);
        statusStrip1.PerformLayout();
        ResumeLayout(false);
        PerformLayout();
    }

    private void BotonComando_Click(object sender, EventArgs e)
    {
        if (sender is Button btn && btn.Tag is string comando)
        {
            MessageBox.Show($"Se envió el comando: {comando}");
        }
    }
}