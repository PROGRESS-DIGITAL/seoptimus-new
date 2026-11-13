#!/usr/bin/env bash
# Автообновление стенда из GitHub: если в отслеживаемой ветке есть новые коммиты,
# забирает их и пересобирает контейнеры. Ветка — та, что сейчас выбрана в /opt/seoptimus.
# Установка в cron (раз в 10 минут):
#   (crontab -l 2>/dev/null; echo "*/10 * * * * /opt/seoptimus/deploy/autodeploy.sh >> /var/log/seoptimus-deploy.log 2>&1") | crontab -
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

# Не запускаться, если прошлая сборка ещё идёт
exec 9>/tmp/seoptimus-deploy.lock
flock -n 9 || { echo "$(date '+%F %T') сборка ещё идёт, пропуск"; exit 0; }

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git fetch -q origin "$BRANCH"
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$BRANCH")"
[ "$LOCAL" = "$REMOTE" ] && exit 0

echo "$(date '+%F %T') $BRANCH: ${LOCAL:0:7} -> ${REMOTE:0:7}, обновляю"
git reset -q --hard "$REMOTE"

COMPOSE=(docker compose)
[ -f deploy/.use-external-db ] && COMPOSE+=(-f docker-compose.yml -f deploy/compose.external-db.yml)
"${COMPOSE[@]}" up -d --build --remove-orphans
docker image prune -f >/dev/null
echo "$(date '+%F %T') готово"
