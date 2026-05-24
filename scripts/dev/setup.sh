#!/usr/bin/env sh
set -e

FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_ENV="$ROOT_DIR/backend-nestjs/.env"

if [ -f "$BACKEND_ENV" ] && [ "$FORCE" -ne 1 ]; then
  echo "backend-nestjs/.env already exists — leaving it alone."
  echo "Run with --force to regenerate."
  exit 0
fi

cat > "$BACKEND_ENV" <<EOF
NODE_ENV=development
PORT=8080
CLIENT_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:8080

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=greenalgeria
DB_PASSWORD=greenalgeria
DB_NAME=greenalgeria
DATABASE_URL=postgresql://greenalgeria:greenalgeria@localhost:5432/greenalgeria

# RustFS / object storage (for photo upload)
OO_OBJECT_STORAGE_ENDPOINT=http://localhost:9000
OO_OBJECT_STORAGE_REGION=us-east-1
OO_OBJECT_STORAGE_BUCKET=green-algeria
OO_OBJECT_STORAGE_ACCESS_KEY=greenalgeria-access
OO_OBJECT_STORAGE_SECRET_KEY=greenalgeria-secret-change-me
EOF

chmod 600 "$BACKEND_ENV"

echo "wrote backend-nestjs/.env"
echo ""
echo "next:"
echo "  ./scripts/dev/start.sh"
