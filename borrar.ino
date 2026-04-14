#include <SPI.h>
#include <SD.h>
#include <HardwareSerial.h>
#include <PZEM004Tv30.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// =========================
// CONFIGURACIÓN Y PINES
// =========================
String DEVICE_UID;
const char* DEFAULT_DEVICE_NAME = "Nuevo dispositivo";
const char* DEFAULT_BLE_NAME = "MEDIDOR-4C10";

#define SD_CS 5
#define SD_SCK 18
#define SD_MISO 19
#define SD_MOSI 23
SPIClass spiSD(VSPI);

#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17
HardwareSerial pzemSerial(2);
PZEM004Tv30 pzem(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN);

#define BLE_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_IDENTITY_UUID "11111111-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_STATUS_UUID "22222222-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_COMMAND_UUID "33333333-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_RESPONSE_UUID "44444444-1fb5-459e-8fcc-c5c9c331914b"

const char* QUEUE_FILE = "/queue.ndjson";
const unsigned long SAMPLE_INTERVAL_MS = 1000;
const unsigned long WINDOW_MS = 60000;

// =========================
// VARIABLES GLOBALES
// =========================
Preferences prefs;
BLECharacteristic* identityChar = nullptr;
BLECharacteristic* statusChar = nullptr;
BLECharacteristic* commandChar = nullptr;
BLECharacteristic* responseChar = nullptr;
BLEServer* pServer = nullptr;

bool bleClientConnected = false;
bool sdOK = false;

String storedDeviceName, storedBleName;
uint32_t nextRecordId = 1;
uint32_t lastSyncedRecordId = 0;
uint32_t bootId = 0;

double sumVoltageAvg = 0, sumCurrentAvg = 0, sumPowerAvg = 0, sumFrequencyAvg = 0, sumPfAvg = 0;
uint32_t sampleCount = 0;
unsigned long lastSample = 0, windowStart = 0;

// =========================
// FUNCIONES AUXILIARES
// =========================
bool validNumber(float v) {
  return !isnan(v) && isfinite(v);
}

String extractStringValue(const String& json, const String& key) {
  String pattern = "\"" + key + "\":";
  int start = json.indexOf(pattern);
  if (start < 0) return "";
  start += pattern.length();
  while (start < (int)json.length() && json[start] == ' ') start++;
  if (start >= (int)json.length()) return "";

  if (json[start] == '"') {
    start++;
    int end = json.indexOf("\"", start);
    return (end < 0) ? "" : json.substring(start, end);
  }

  int endComma = json.indexOf(",", start);
  int endBrace = json.indexOf("}", start);
  int end = (endComma == -1) ? endBrace : (endBrace == -1 ? endComma : min(endComma, endBrace));
  return (end < 0) ? "" : json.substring(start, end);
}

long extractLongValue(const String& json, const String& key, long defaultValue) {
  String raw = extractStringValue(json, key);
  raw.trim();
  return raw.length() == 0 ? defaultValue : raw.toInt();
}

void resetAccumulators() {
  sumVoltageAvg = sumCurrentAvg = sumPowerAvg = sumFrequencyAvg = sumPfAvg = 0.0;
  sampleCount = 0;
}

void initSD() {
  spiSD.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (!SD.begin(SD_CS, spiSD, 4000000)) {
    sdOK = false;
    Serial.println("SD Error");
    return;
  }
  sdOK = true;

  if (!SD.exists(QUEUE_FILE)) {
    File f = SD.open(QUEUE_FILE, FILE_WRITE);
    if (f) f.close();
  }
  Serial.println("SD OK");
}

uint32_t countPendingRecords() {
  if (!sdOK) return 0;
  File file = SD.open(QUEUE_FILE, FILE_READ);
  if (!file) return 0;

  uint32_t count = 0;
  while (file.available()) {
    String line = file.readStringUntil('\n');
    long rid = extractLongValue(line, "rid", -1);
    if (rid > (long)lastSyncedRecordId) count++;
  }
  file.close();
  return count;
}

void saveReadingLine(uint32_t tMs, uint32_t samples, double v, double i, double p, double f, double pf, double e) {
  if (!sdOK) return;

  File file = SD.open(QUEUE_FILE, FILE_APPEND);
  if (!file) return;

  file.printf(
    "{\"rid\":%u,\"bootId\":%u,\"duid\":\"%s\",\"t\":%u,\"s\":%u,\"v\":%.2f,\"i\":%.3f,\"p\":%.2f,\"f\":%.2f,\"pf\":%.3f,\"e\":%.6f}\n",
    nextRecordId, bootId, DEVICE_UID.c_str(), tMs, samples, v, i, p, f, pf, e);
  file.close();

  nextRecordId++;
  prefs.putUInt("nextRecordId", nextRecordId);
  Serial.printf("Guardado rid=%u\n", nextRecordId - 1);
}

// =========================
// BLE LÓGICA
// =========================
String buildIdentityJson() {
  String json = "{";
  json += "\"deviceUid\":\"" + DEVICE_UID + "\",";
  json += "\"deviceName\":\"" + storedDeviceName + "\",";
  json += "\"bleName\":\"" + storedBleName + "\"";
  json += "}";
  return json;
}

String buildStatusJson() {
  String json = "{";
  json += "\"sdReady\":" + String(sdOK ? "true" : "false") + ",";
  json += "\"pendingCount\":" + String(countPendingRecords()) + ",";
  json += "\"lastSyncedRecordId\":" + String(lastSyncedRecordId) + ",";
  json += "\"bootId\":" + String(bootId) + ",";
  json += "\"nowMs\":" + String(millis());
  json += "}";
  return json;
}

void notifyResponse(String payload) {
  if (!responseChar || !bleClientConnected) return;
  responseChar->setValue(payload.c_str());
  responseChar->notify();
  delay(120);
}

void updateIdentityCharacteristic() {
  if (!identityChar) return;
  identityChar->setValue(buildIdentityJson().c_str());
}

void updateStatusCharacteristic() {
  if (!statusChar) return;
  statusChar->setValue(buildStatusJson().c_str());
}

void sendPendingCountResponse() {
  notifyResponse("{\"type\":\"pending_count\",\"pendingCount\":" + String(countPendingRecords()) + "}");
}

void sendBatchResponse(uint32_t from, uint32_t limit) {
  if (!sdOK) {
    notifyResponse("{\"type\":\"error\",\"message\":\"sd_not_ready\"}");
    return;
  }

  if (limit == 0) limit = 1;
  if (limit > 5) limit = 5;

  File file = SD.open(QUEUE_FILE, FILE_READ);
  if (!file) {
    notifyResponse("{\"type\":\"error\",\"message\":\"queue_open_failed\"}");
    return;
  }

  notifyResponse(
    "{\"type\":\"batch_start\",\"fromRecordId\":" + String(from) +
    ",\"limit\":" + String(limit) +
    ",\"bootId\":" + String(bootId) +
    ",\"nowMs\":" + String(millis()) +
    "}"
  );

  uint32_t sent = 0;
  uint32_t upToRecordId = 0;

  while (file.available() && sent < limit) {
    String line = file.readStringUntil('\n');
    long rid = extractLongValue(line, "rid", -1);

    if (rid >= (long)from && rid > (long)lastSyncedRecordId) {
      notifyResponse("{\"type\":\"reading\",\"reading\":" + line + "}");
      upToRecordId = rid;
      sent++;
    }
  }

  file.close();
  notifyResponse("{\"type\":\"batch_end\",\"count\":" + String(sent) + ",\"upToRecordId\":" + String(upToRecordId) + "}");
}

// =========================
// CALLBACKS
// =========================
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pS) {
    bleClientConnected = true;
    Serial.println("App Conectada");
  }

  void onDisconnect(BLEServer* pS) {
    bleClientConnected = false;
    Serial.println("App Desconectada");
    BLEDevice::startAdvertising();
  }
};

class CommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pC) {
    String json = String(pC->getValue().c_str());
    String cmd = extractStringValue(json, "cmd");

    Serial.print("CMD <- ");
    Serial.println(json);

    if (cmd == "get_batch") {
      uint32_t f = extractLongValue(json, "fromRecordId", lastSyncedRecordId + 1);
      uint32_t l = extractLongValue(json, "limit", 5);
      sendBatchResponse(f, l);
      return;
    }

    if (cmd == "get_pending_count") {
      sendPendingCountResponse();
      return;
    }

    if (cmd == "mark_synced") {
      uint32_t upTo = extractLongValue(json, "upToRecordId", lastSyncedRecordId);

      if (upTo > lastSyncedRecordId) {
        lastSyncedRecordId = upTo;
        prefs.putUInt("lastSync", lastSyncedRecordId);
        Serial.printf("Persistencia: Guardado lastSync = %u\n", lastSyncedRecordId);
      } else {
        Serial.printf("mark_synced ignorado. upTo=%u, lastSync=%u\n", upTo, lastSyncedRecordId);
      }

      updateStatusCharacteristic();

      String resp = "{\"type\":\"mark_synced_ok\",\"lastSyncedRecordId\":";
      resp += String(lastSyncedRecordId);
      resp += "}";

      notifyResponse(resp);
      return;
    }

    if (cmd == "read_identity") {
      notifyResponse(buildIdentityJson());
      return;
    }

    if (cmd == "read_status") {
      notifyResponse(buildStatusJson());
      return;
    }

    if (cmd == "reset") {
      resetLecturas();

      notifyResponse(
        "{\"type\":\"reset_ok\",\"nextRecordId\":1,\"lastSyncedRecordId\":0}"
      );

      sendPendingCountResponse();
      return;
    }

    notifyResponse("{\"type\":\"error\",\"message\":\"unknown_command\"}");
  }
};

String generateUIDFromChip() {
  uint64_t chipid = ESP.getEfuseMac();
  char uid[32];
  sprintf(uid, "esp32-%04X%08X",
          (uint16_t)(chipid >> 32),
          (uint32_t)chipid);
  return String(uid);
}

String getOrCreateDeviceUID() {
  String uid = prefs.getString("deviceUid", "");
  if (uid.length() == 0) {
    uid = generateUIDFromChip();
    prefs.putString("deviceUid", uid);
  }
  return uid;
}

void resetLecturas() {
  Serial.println("Reiniciando lecturas y RID...");

  // 1. Borrar cola histórica
  if (sdOK && SD.exists(QUEUE_FILE)) {
    if (SD.remove(QUEUE_FILE)) {
      Serial.println("Archivo queue.ndjson eliminado");
    } else {
      Serial.println("No se pudo eliminar queue.ndjson");
    }
  }

  // 2. Volver a crear el archivo vacío
  if (sdOK) {
    File f = SD.open(QUEUE_FILE, FILE_WRITE);
    if (f) {
      f.close();
      Serial.println("Archivo queue.ndjson recreado vacío");
    } else {
      Serial.println("No se pudo recrear queue.ndjson");
    }
  }

  // 3. Reiniciar persistencia
  nextRecordId = 1;
  lastSyncedRecordId = 0;

  prefs.putUInt("nextRecordId", nextRecordId);
  prefs.putUInt("lastSync", lastSyncedRecordId);

  // 4. Limpiar acumuladores de ventana actual
  resetAccumulators();
  windowStart = millis();
  lastSample = millis();

  updateStatusCharacteristic();

  Serial.println("Reset completado: nextRecordId=1, lastSync=0");
}

void setup() {
  Serial.begin(115200);

  prefs.begin("ecomonitor", false);
  DEVICE_UID = getOrCreateDeviceUID();

  storedDeviceName = prefs.getString("deviceName", DEFAULT_DEVICE_NAME);
  storedBleName = prefs.getString("bleName", DEFAULT_BLE_NAME);

  nextRecordId = prefs.getUInt("nextRecordId", 1);
  lastSyncedRecordId = prefs.getUInt("lastSync", 0);

  uint32_t previousBootId = prefs.getUInt("bootId", 0);
  bootId = previousBootId + 1;
  prefs.putUInt("bootId", bootId);

  Serial.printf("Persistencia cargada: NextRID=%u, LastSynced=%u, Boot=%u\n",
                nextRecordId, lastSyncedRecordId, bootId);

  initSD();
  pzemSerial.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);

  BLEDevice::init(storedBleName.c_str());
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pSvc = pServer->createService(BLE_SERVICE_UUID);

  identityChar = pSvc->createCharacteristic(BLE_IDENTITY_UUID, BLECharacteristic::PROPERTY_READ);
  statusChar = pSvc->createCharacteristic(BLE_STATUS_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  commandChar = pSvc->createCharacteristic(BLE_COMMAND_UUID, BLECharacteristic::PROPERTY_WRITE);
  responseChar = pSvc->createCharacteristic(BLE_RESPONSE_UUID, BLECharacteristic::PROPERTY_NOTIFY);

  commandChar->setCallbacks(new CommandCallbacks());
  statusChar->addDescriptor(new BLE2902());
  responseChar->addDescriptor(new BLE2902());

  updateIdentityCharacteristic();
  updateStatusCharacteristic();

  pSvc->start();
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMaxPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("Sistema listo y anunciando...");

  windowStart = millis();
}

void loop() {
  unsigned long now = millis();

  if (now - lastSample >= SAMPLE_INTERVAL_MS) {
    lastSample = now;

    float v = pzem.voltage();
    float i = pzem.current();
    float p = pzem.power();
    float f = pzem.frequency();
    float pf = pzem.pf();

    if (validNumber(v) && validNumber(i) && validNumber(p) && validNumber(f) && validNumber(pf)) {
      sumVoltageAvg += v;
      sumCurrentAvg += i;
      sumPowerAvg += p;
      sumFrequencyAvg += f;
      sumPfAvg += pf;
      sampleCount++;
    }
  }

  if (now - windowStart >= WINDOW_MS) {
    if (sampleCount > 0) {
      saveReadingLine(
        now,
        sampleCount,
        sumVoltageAvg / sampleCount,
        sumCurrentAvg / sampleCount,
        sumPowerAvg / sampleCount,
        sumFrequencyAvg / sampleCount,
        sumPfAvg / sampleCount,
        pzem.energy());
      updateStatusCharacteristic();
    }

    resetAccumulators();
    windowStart = now;
  }
}