#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
set -a
. ./.env
set +a

STATE_DIR="$(pwd)/.state"
SOURCE_DIR="$STATE_DIR/supabase-source"
PROJECT_DIR="$STATE_DIR/supabase"
mkdir -p "$STATE_DIR"

if [ ! -d "$SOURCE_DIR/.git" ]; then
  git clone --depth 1 --branch "$SUPABASE_REF" https://github.com/supabase/supabase.git "$SOURCE_DIR"
fi

if [ ! -d "$PROJECT_DIR" ]; then
  (
    cd "$STATE_DIR"
    sh "$SOURCE_DIR/docker/setup.sh" --skip-deps -y --ref "$SUPABASE_REF" --project-dir supabase
  )
fi

api_url="\${PUBLIC_SCHEME}://\${SUPABASE_API_HOST}"
studio_url="\${PUBLIC_SCHEME}://\${SUPABASE_STUDIO_HOST}"

sed -i \
  -e "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=$api_url|" \
  -e "s|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=$api_url/auth/v1|" \
  -e "s|^SITE_URL=.*|SITE_URL=\${PUBLIC_SCHEME}://\${BASE_DOMAIN}|" \
  -e "s|^COMPOSE_FILE=.*|COMPOSE_FILE=docker-compose.yml:docker-compose.devcloud.yml|" \
  "$PROJECT_DIR/.env"

cat > "$PROJECT_DIR/docker-compose.devcloud.yml" <<EOF
services:
  api-gw:
    networks:
      default:
      devcloud:
    labels:
      - traefik.enable=true
      - traefik.http.routers.supabase-api.rule=Host(\`\${SUPABASE_API_HOST}\`)
      - traefik.http.routers.supabase-api.entrypoints=web
      - traefik.http.services.supabase-api.loadbalancer.server.port=8000
  studio:
    networks:
      default:
      devcloud:
    labels:
      - traefik.enable=true
      - traefik.http.routers.supabase-studio.rule=Host(\`\${SUPABASE_STUDIO_HOST}\`)
      - traefik.http.routers.supabase-studio.entrypoints=web
      - traefik.http.services.supabase-studio.loadbalancer.server.port=3000
networks:
  devcloud:
    external: true
    name: devcloud
EOF

(
  cd "$PROJECT_DIR"
  sh run.sh start
)

echo "Supabase API:    $api_url"
echo "Supabase Studio: $studio_url"
echo "Secrets:         cd $PROJECT_DIR && sh run.sh secrets"
