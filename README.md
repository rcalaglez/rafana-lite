# Rafana-lite

Rafana-lite es un sistema de monitorización de logs centralizado en tiempo real, diseñado para visualizar y gestionar múltiples archivos de log a través de una interfaz web.

## Características

- 🔄 Monitorización en tiempo real
- 📑 Soporte para múltiples archivos de log
- 🎨 Interfaz web responsive con Bootstrap
- 🔍 Búsqueda en tiempo real dentro de cada log
- 🎯 Clasificación automática de logs (ERROR, WARN, INFO)
- ⚙️ Configuración flexible por archivo
- 🌈 Resaltado de tipos de log con colores
- ⏱️ Timestamps personalizables
- 📊 Control de límite de líneas mostradas

## Requisitos

- Node.js
- npm

## Instalación

```bash
git clone https://github.com/rcalaglez/rafana-lite.git
cd rafana-lite
npm install
```

## Configuración

Edita el archivo `config.json` para configurar los archivos de log a monitorizar:

```json
{
  "logs": [
    {
      "file": "./logs/ejemplo.log",
      "type": {
        "error": ["ERROR", "FAIL"],
        "warn": ["WARNING", "WARN"],
        "info": ["INFO"]
      },
      "printOrder": "asc",
      "refreshInterval": 1000,
      "logLevels": ["error", "warn", "info"],
      "maxLines": 100,
      "timestampFormat": "YYYY-MM-DD HH:mm:ss"
    }
  ]
}
```

## Uso

1. Inicia el servidor:

```bash
node server.js
```

2. Accede a la interfaz web:

```
http://localhost:8080
```

## Estructura del Proyecto

```
├── client.html     # Interfaz web
├── config.json     # Configuración de logs
├── package.json    # Dependencias
└── server.js       # Servidor WebSocket
```

## Dependencias

- ws: WebSocket server
- moment: Formateo de timestamps

## Licencia

ISC
