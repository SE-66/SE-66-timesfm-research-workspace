#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Docker Engine + Compose plugin are required." >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL is required to generate bootstrap secrets." >&2
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  control_token="$(openssl rand -hex 32)"
  runtime_token="$(openssl rand -hex 32)"
  admin_password="$(openssl rand -base64 24 | tr -d '\n=/+' | cut -c1-24)"
  sed -i \
    -e "s|^CONTROL_PLANE_API_TOKEN=.*|CONTROL_PLANE_API_TOKEN=$control_token|" \
    -e "s|^RUNTIME_AGENT_TOKEN=.*|RUNTIME_AGENT_TOKEN=$runtime_token|" \
    -e "s|^GITEA_ADMIN_PASSWORD=.*|GITEA_ADMIN_PASSWORD=$admin_password|" \
    .env
  echo "Created platform/.env with generated secrets."
fi

set -a
. ./.env
set +a

docker compose up -d --build traefik gitea runtime-agent dashboard

echo "Waiting for Gitea..."
i=0
until docker compose exec -T gitea wget -q -O- http://127.0.0.1:3000/api/v1/version >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -gt 60 ]; then
    echo "Gitea did not become healthy." >&2
    exit 1
  fi
  sleep 2
done

if ! docker compose exec -u git -T gitea gitea admin user list | grep -q "$GITEA_ADMIN_USER"; then
  docker compose exec -u git -T gitea gitea admin user create \
    --username "$GITEA_ADMIN_USER" \
    --password "$GITEA_ADMIN_PASSWORD" \
    --email "$GITEA_ADMIN_EMAIL" \
    --admin \
    --must-change-password=false
fi

if [ -z "\${GITEA_TOKEN:-}" ]; then
  token_output="$(docker compose exec -u git -T gitea gitea admin user generate-access-token \
    --username "$GITEA_ADMIN_USER" \
    --token-name devcloud-control-plane \
    --scopes all)"
  GITEA_TOKEN="$(printf '%s\n' "$token_output" | sed -n 's/.*Access token was successfully created: //p' | tail -n1)"
  if [ -z "$GITEA_TOKEN" ]; then
    echo "Could not parse generated Gitea token." >&2
    exit 1
  fi
  sed -i "s|^GITEA_TOKEN=.*|GITEA_TOKEN=$GITEA_TOKEN|" .env
fi

docker compose up -d --build control-plane

echo ""
echo "DevCloud core is running."
echo "Dashboard: \${PUBLIC_SCHEME}://\${BASE_DOMAIN}"
echo "Git:       \${PUBLIC_SCHEME}://git.\${BASE_DOMAIN}"
echo "Token:     $(grep '^CONTROL_PLANE_API_TOKEN=' .env | cut -d= -f2-)"
echo ""
echo "To add self-hosted Supabase:"
echo "  ./scripts/bootstrap-supabase.sh"
