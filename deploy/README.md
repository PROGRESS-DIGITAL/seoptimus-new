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

Если репозиторий станет приватным, для `git clone` на сервере понадобится deploy key
(GitHub → Settings → Deploy keys, ключ из `ssh-keygen -t ed25519` на сервере, клонировать по `git@github.com:...`).

Пароли можно сгенерировать так: `openssl rand -hex 24`.

## Вариант: своя PostgreSQL (managed-БД Timeweb)

1. В панели БД создайте **отдельную пустую базу** (например `seoptimus_test`) и пользователя.
   Не используйте базу с чужими таблицами: миграция (`drizzle-kit push --force`) приводит
   схему к коду и может удалить таблицы, которых в коде нет.
2. Если сервер и БД в одной приватной сети Timeweb, используйте внутренний адрес БД.
3. В `.env` добавьте строку (вместо `POSTGRES_PASSWORD`):
   `DATABASE_URL=postgres://user:password@host:5432/seoptimus_test?sslmode=require`
   (`sslmode=require` нужен, если БД принимает только SSL-подключения; для внутреннего адреса обычно не нужен).
4. Запуск без контейнера Postgres:
   ```bash
   docker compose -f docker-compose.yml -f deploy/compose.external-db.yml up -d --build
   ```

## 3. Обновление

```bash
cd /opt/seoptimus && git pull && docker compose up -d --build
```

### Автообновление раз в 10 минут

```bash
(crontab -l 2>/dev/null; echo "*/10 * * * * /opt/seoptimus/deploy/autodeploy.sh >> /var/log/seoptimus-deploy.log 2>&1") | crontab -
```

Скрипт смотрит на ветку, которая сейчас выбрана в `/opt/seoptimus` (`git checkout main` — следить за main),
и пересобирает стенд только при новых коммитах. Локальные правки файлов в папке затираются, `.env` не трогается.
Журнал: `tail -f /var/log/seoptimus-deploy.log`. Для варианта с внешней БД создайте файл `deploy/.use-external-db`.

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
  задайте `OPENAI_PROXY=http://user:pass@host:port` (HTTP(S)-прокси за рубежом), `OPENAI_BASE_URL` шлюза
  либо поставьте сервер в зарубежном регионе. После правки `.env`: `docker compose up -d`.
- Вебхуки CloudPayments указывать на `https://<домен>/api/cloudpayments/{check,pay,fail,recurrent}`.
- Порты 80 и 443 должны быть открыты (в Timeweb по умолчанию открыты, если не включён firewall).
