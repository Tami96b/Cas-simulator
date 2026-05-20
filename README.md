# CAS Simulator Platform

Moderná webová platforma pre simuláciu dynamických systémov využívajúca Octave numerické výpočty,
REST API architektúru, analytiku, logovanie, OpenAPI dokumentáciu a interaktívnu vizualizáciu.

---

# Funkcionalita

## CAS Konzola
- Spúšťanie Octave príkazov cez REST API
- Realtime vykonávanie príkazov
- Konzolový výstup
- Spracovanie chýb
- Token-based autentifikácia

## Dynamické simulácie

### Inverzné kyvadlo
- Simulácia dynamického systému
- Realtime vykresľovanie grafov
- Interaktívna animácia
- Konfigurácia parametrov

### Gulička na tyči (Ball Beam)
- Dynamická simulácia ball-beam systému
- Animovaná vizualizácia
- Konfigurovateľné parametre
- Realtime grafy

## Logovanie
- Logovanie požiadaviek
- Evidencia simulácií
- CSV export
- Opätovné otvorenie požiadaviek z logov

## Štatistiky
- Analytika používania simulácií
- Štatistiky Pendulum vs Ball Beam
- Vizualizácia pomocou Chart.js
- Detailná tabuľka použitia

## OpenAPI Dokumentácia
- Swagger/OpenAPI integrácia
- Embedded API dokumentácia
- PDF export dokumentácie

## UI/UX
- Responsive Bootstrap frontend
- Dark/Light mode
- Lokalizácia (EN/SK)
- Toast notifikácie
- Loading overlay
- Glassmorphism dizajn

---

# Použité technológie

## Backend
- PHP 8
- REST API architektúra
- GNU Octave
- MySQL
- Docker

## Frontend
- Bootstrap 5
- Vanilla JavaScript
- Chart.js
- Swagger UI

## Infraštruktúra
- Docker Compose
- Kontajnerizované služby

---

# Architektúra

```text
Frontend (Bootstrap + JS)
            ↓
        PHP REST API
            ↓
    Octave Execution Layer
            ↓
       MySQL Database
            ↓
   Logs + Statistics Layer
```

---

# Štruktúra projektu

```text
project/
│
├── public/
│   ├── css/
│   ├── js/
│   ├── pages/
│   └── index.html
│
├── api/
│   ├── controllers/
│   ├── middleware/
│   └── index.php
│
├── docs/
│   ├── openapi.yaml
│   └── generate_pdf.py
│
├── config/
│
├── docker-compose.yml
│
└── README.md
```

---

# Inštalácia

## Požiadavky
- Docker
- Docker Compose

---

# Spustenie projektu

## 1. Klonovanie repozitára

```bash
git clone <repository-url>
cd <project-folder>
```

---

## 2. Vytvorenie .env súboru

Skopíruj:

```text
.env.example
```

na:

```text
.env
```

---

## 3. Spustenie kontajnerov

```bash
docker compose up --build
```

---

# URL adresy aplikácie

## Frontend
```text
http://localhost
```

## API Health
```text
http://localhost/api/health
```

## OpenAPI dokumentácia
```text
http://localhost/api/docs
```

## PDF dokumentácia
```text
http://localhost/api/docs/pdf
```

---

# Autentifikácia

API používa Bearer token autentifikáciu.

Príklad:

```http
Authorization: Bearer SECRET
```

Token je definovaný v:

```env
API_TOKEN=SECRET
```

---

# Hlavné API endpointy

## Spustenie Octave príkazu

```http
POST /api/eval
```

Request:

```json
{
  "command": "a = 5 + 3\na * 2",
  "session_id": "anon"
}
```

---

## Inverzné kyvadlo

```http
POST /api/simulate/pendulum
```

---

## Ball Beam

```http
POST /api/simulate/ball-beam
```

---

## Logy

```http
GET /api/logs
```

```http
GET /api/logs/export
```

---

## Štatistiky

```http
GET /api/stats
```

---

# Frontend stránky

| Stránka | Popis |
|---|---|
| Home | Úvodná stránka |
| CAS Console | Spúšťanie Octave príkazov |
| Pendulum | Simulácia inverzného kyvadla |
| Ball Beam | Simulácia ball-beam systému |
| Logs | Logy požiadaviek |
| Statistics | Analytika používania |
| API Docs | Swagger/OpenAPI dokumentácia |

---

# Lokalizácia

Podporované jazyky:
- English
- Slovenský jazyk

Výber jazyka je uložený v localStorage.

---

# Dark Mode

Aplikácia podporuje:
- Light mode
- Dark mode

Nastavenie témy sa uchováva v localStorage.

---

# Export funkcionalita

## CSV Export
- Export logov požiadaviek

## PDF Export
- Export OpenAPI dokumentácie

---

# Bezpečnosť

- Bearer token autentifikácia
- Middleware autorizácia
- Chránené API endpointy
- CORS podpora

---

# Autor

Tamás Bagin
Kinga Lángyiová
