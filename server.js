const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const moment = require("moment");

let lastFileSizes = {};

// Leer configuración del archivo JSON
const config = JSON.parse(fs.readFileSync("config.json"));

// Almacenar los clientes WebSocket
let clients = [];

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    fs.readFile("client.html", (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Error loading client.html");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  }
});

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  clients.push(ws);
  console.log("Nuevo cliente conectado");
  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
    console.log("Cliente desconectado");
  });
});

// Función para clasificar el tipo de log
function classifyLog(logMessage, typeConfig) {
  if (typeConfig.error.some((keyword) => logMessage.includes(keyword))) {
    return "error";
  }
  if (typeConfig.warn.some((keyword) => logMessage.includes(keyword))) {
    return "warn";
  }
  if (typeConfig.info.some((keyword) => logMessage.includes(keyword))) {
    return "info";
  }
  return "default";
}

// Función para resaltar las etiquetas INFO, ERROR, WARN
function highlightLog(logMessage) {
  return logMessage
    .replace(/\[INFO\]/g, '<span class="log-info">[INFO]</span>')
    .replace(/\[ERROR\]/g, '<span class="log-error">[ERROR]</span>')
    .replace(/\[WARNING\]/g, '<span class="log-warn">[WARNING]</span>');
}

// Función para enviar logs a todos los clientes
function broadcastLog(logMessage, logType, filename, printOrder, timestamp) {
  const message = {
    file: filename,
    log: highlightLog(logMessage), // Resaltar etiquetas en el log
    type: logType,
    printOrder: printOrder,
    timestamp: timestamp,
  };

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Función para procesar y filtrar logs
function processLogs(logConfig, isInitial = false) {
  const absolutePath = path.resolve(logConfig.file);

  // Leer el tamaño del archivo para detectar nuevos logs
  fs.stat(absolutePath, (err, stats) => {
    if (err) throw err;

    const previousSize = isInitial ? 0 : lastFileSizes[absolutePath] || 0;
    const currentSize = stats.size;

    // Leer todo el archivo si es la primera carga
    if (isInitial || currentSize > previousSize) {
      const stream = fs.createReadStream(absolutePath, {
        start: previousSize,
        end: currentSize,
        encoding: "utf8",
      });

      let data = "";
      stream.on("data", (chunk) => {
        data += chunk;
      });

      stream.on("end", () => {
        const lines = data.split("\n");
        lines.forEach((line) => {
          if (line.trim()) {
            const logType = classifyLog(line, logConfig.type);

            // Filtrar los logs según los niveles permitidos en logLevels
            if (logConfig.logLevels.includes(logType)) {
              const timestamp = moment().format(logConfig.timestampFormat); // Formato de la fecha
              broadcastLog(
                line,
                logType,
                path.basename(absolutePath),
                logConfig.printOrder,
                timestamp
              );
            }
          }
        });
      });

      lastFileSizes[absolutePath] = currentSize;
    }
  });
}

// Ejecutar el proceso de logs en intervalos regulares según "refreshInterval"
config.logs.forEach((logConfig) => {
  lastFileSizes[path.resolve(logConfig.file)] = 0; // Inicializamos el tamaño del archivo en 0

  // Leer todo el contenido inicial del archivo de log
  processLogs(logConfig, true);

  // Continuar monitoreando las nuevas líneas
  setInterval(() => {
    processLogs(logConfig);
  }, logConfig.refreshInterval);
});

// Iniciar servidor HTTP
server.listen(8080, () => {
  console.log("Servidor escuchando en http://localhost:8080");
});
