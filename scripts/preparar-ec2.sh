#!/usr/bin/env bash
# Prepara una EC2 para HuertoHogar: instala Docker + Docker Compose v2, crea /opt/huertohogar
# y agrega swap en instancias con poca memoria.
#
# Lo ejecutan automáticamente los workflows de GitHub Actions (frontend, backend y database)
# antes de cada despliegue. Es idempotente: si la EC2 ya está lista, no cambia nada.
# Funciona en Ubuntu (apt) y Amazon Linux 2023 (dnf).
set -euo pipefail

USUARIO="$(id -un)"
COMPOSE_VERSION="v2.29.7"

# 1) Docker
if ! command -v docker >/dev/null 2>&1; then
  echo ">> Instalando Docker..."
  if command -v apt-get >/dev/null 2>&1; then
    # Lock::Timeout: en una EC2 recién creada apt puede estar ocupado con actualizaciones automáticas.
    sudo apt-get -o DPkg::Lock::Timeout=600 update -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=600 install -y docker.io curl
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y docker
  else
    echo "Sistema operativo no soportado: instala Docker a mano." >&2
    exit 1
  fi
fi
sudo systemctl enable --now docker

# 2) Docker Compose v2 (comando "docker compose")
if ! sudo docker compose version >/dev/null 2>&1; then
  echo ">> Instalando Docker Compose ${COMPOSE_VERSION}..."
  if command -v apt-get >/dev/null 2>&1 \
     && sudo DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=600 install -y docker-compose-v2 >/dev/null 2>&1; then
    :
  else
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    sudo curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  fi
fi

# 3) Permitir usar docker sin sudo (aplica desde la siguiente conexión SSH)
if ! id -nG "$USUARIO" | grep -qw docker; then
  sudo usermod -aG docker "$USUARIO"
fi

# 4) Carpeta de despliegue
sudo mkdir -p /opt/huertohogar
sudo chown "$USUARIO":"$USUARIO" /opt/huertohogar

# 5) Swap de 2 GB si la instancia tiene menos de 2 GB de RAM (Java y MySQL lo agradecen)
MEMORIA_MB="$(free -m | awk '/^Mem:/{print $2}')"
if [ "$MEMORIA_MB" -lt 2000 ] && [ -z "$(sudo swapon --show)" ]; then
  echo ">> Creando swap de 2 GB (RAM: ${MEMORIA_MB} MB)..."
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo ">> EC2 lista: $(sudo docker --version) · Compose $(sudo docker compose version --short)"
