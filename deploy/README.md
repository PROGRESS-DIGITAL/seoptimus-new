# Тестовый стенд на Timeweb Cloud

Всё поднимается одной командой через Docker Compose на облачном сервере (VPS):
Postgres, приложение, Caddy с автоматическим HTTPS. Миграции и начальные данные
применяются сами при каждом запуске (сервис `migrate`).

## 1. Сервер

1. В панели Timeweb Cloud: **Облачные серверы → Создать**.
   - Образ: **Ubuntu 24.04** (или готовый образ с Docker из маркетплейса).
   - Конфигурация: от **2 vCPU / 4 ГБ RAM / 40 ГБ NVMe** (сборка Next.js на 2 ГБ может упасть по памяти).
   - Регион: любой; если нужен прямой доступ к OpenAI без шлюза — Нидерланды/Германия.
   - Добавить свой SSH-ключ.
2. Домен для стенда, например `test.seoptimus.ru`: A-запись на IP сервера.
   Если домена пока нет, используйте `<IP-через-дефисы>.sslip.io` (например `5-35-1-2.sslip.io`):
   он сам указывает на IP, и Caddy выпустит на него сертификат.

> HTTPS нужен обязательно: в продакшн-режиме cookie сессии ставится с флагом `Secure`,
> и по голому `http://IP` браузер не сохранит вход.

## 2. Установка

```bash
ssh root@<IP>
curl -fsSL https://get.docker.com | sh          # если Docker ещё не установлен
git clone https://github.com/progress-digital/seoptimus-new.git /opt/seoptimus
cd /opt/seoptimus
cp deploy/env.server.example .env
nano .env    # DOMAIN, POSTGRES_PASSWORD, SESSION_SECRET, APP_URL, ADMIN_EMAILS, ключи
docker compose up -d --build
```

Репозиторий приватный, поэтому для `git clone` на сервере нужен deploy key
(GitHub → Settings → Deploy keys, ключ из `ssh-keygen -t ed25519` на сервере, клонировать по `git@github.com:...`).

Пароли можно сгенерировать так: `openssl rand -hex 24`.

## 3. Обновление

```bash
cd /opt/seoptimus && git pull && docker compose up -d --build
```

## Полезное

| Что | Команда |
| --- | --- |
| Логи приложения | `docker compose logs -f app` |
| Код входа (если нет SMTP) | `docker compose logs app \| grep "Код входа"` |
| Логи миграций | `docker compose logs migrate` |
| Консоль БД | `docker compose exec db psql -U app seoptimus` |
| Бэкап БД | `docker compose exec db pg_dump -U app seoptimus > backup.sql` |

Данные хранятся в docker-томах: `pgdata` (база), `storage` (сгенерированные картинки),
`caddy_data` (сертификаты). `docker compose down` их не трогает, `down -v` удаляет.

## Замечания

- Без `OPENAI_API_KEY` стенд работает в демо-режиме. Из РФ-региона OpenAI напрямую недоступен:
  нужен `OPENAI_BASE_URL` шлюза либо сервер в зарубежном регионе.
- Вебхуки CloudPayments указывать на `https://<домен>/api/cloudpayments/{check,pay,fail,recurrent}`.
- Порты 80 и 443 должны быть открыты (в Timeweb по умолчанию открыты, если не включён firewall).
