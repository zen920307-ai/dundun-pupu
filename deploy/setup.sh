#!/bin/sh
set -eu
base=/srv/dundun-pupu
mkdir -p "$base/releases" "$base/uploads" "$base/acme" /opt/dundun-pupu
if ! id dundun-pupu >/dev/null 2>&1; then
  useradd --system --home-dir "$base" --shell /usr/sbin/nologin dundun-pupu
fi
if [ ! -x /opt/dundun-pupu/node/bin/node ]; then
  cd /opt/dundun-pupu
  curl -fsS --max-time 90 https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt -o SHASUMS256.txt
  filename=$(awk '/node-v[0-9.]+-linux-x64.tar.xz$/ { print $2 }' SHASUMS256.txt)
  test -n "$filename"
  curl -fsS --max-time 300 "https://nodejs.org/dist/latest-v24.x/$filename" -o "$filename"
  awk '/node-v[0-9.]+-linux-x64.tar.xz$/ { print }' SHASUMS256.txt | sha256sum -c -
  mkdir -p node
  tar -xJf "$filename" -C node --strip-components=1
fi
/opt/dundun-pupu/node/bin/node --version
install -m 644 "$base/dundun-pupu.service" /etc/systemd/system/dundun-pupu.service
systemctl daemon-reload
systemctl enable dundun-pupu
