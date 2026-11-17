#!/usr/bin/env bash
# Respaldo de la base de datos (entregable de la rúbrica: script/respaldo .sql).
# Uso (en la EC2 de base de datos, dentro de /opt/huertohogar/database, o en local dentro de database/):
#   ./backup.sh                  → genera backup.sql
#   ./backup.sh mi-respaldo.sql  → nombre personalizado
# Lee DB_NAME y DB_ROOT_PASSWORD del archivo .env (no las pide ni las imprime).
set -euo pipefail

cd "$(dirname "$0")"
SALIDA="${1:-backup.sql}"

set -a
# shellcheck disable=SC1091
source .env
set +a

docker compose exec -T -e MYSQL_PWD="$DB_ROOT_PASSWORD" db \
  mysqldump -u root --databases "$DB_NAME" \
  --single-transaction --routines --triggers --no-tablespaces \
  --default-character-set=utf8mb4 > "$SALIDA"

echo "Respaldo generado en $SALIDA ($(wc -l < "$SALIDA") líneas)"
