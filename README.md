# ⚛️ CONTROL PANEL ⚛️

![Header](imgs/header.png)

Interfaz centralizada (web/escritorio) para el control de actuadores y monitoreo de sensores biométricos en redes PAN. **Control Panel** gestiona la interacción entre módulos mediante protocolos seriales, permitiendo el intercambio ágil de comandos y datos de red.

---

## 🧱 Arquitectura general del sistema

![AGS]()

![AS]()

---

## :file_folder: Organizacion carpetas

```plaintext
BTN/
├── app/
|   ├── Escritorio/
|   |   ├── ControlPanel.API/
|   |   └── HostApp/
|   └── Frontend/
├── docs/
├── imgs/
|   └── DF/
├── test/
|   ├── BotoneraSerial/
|   └── PanelControlApp/
├── uC/
|   ├── Codigos nuevos/
|   └── Codigos originales/
├── .gitignore/
├── LICENSE/
└── README.md/
```

---

## :shipit: Copiar proyecto

```sh
git clone https://github.com/Jelp200/BTN.git
```
