#!/bin/sh
set -eu
release=$1
digest=$2
case "$release" in release-*) suffix=${release#release-};; *) exit 1;; esac
case "$suffix" in *[!0-9]*|'') echo 'Invalid release' >&2; exit 1;; esac
case "$digest" in *[!a-f0-9]*|'') echo 'Invalid checksum' >&2; exit 1;; esac
[ "${#digest}" -eq 64 ]
base=/srv/dundun-pupu
archive=$base/uploads/$release.tar.gz
printf '%s  %s\n' "$digest" "$archive" | sha256sum -c -
mkdir -p "$base/releases/$release"
previous=$(readlink "$base/current" || true)
if [ -n "$previous" ]; then
  cp -al "$previous/." "$base/releases/$release/"
  # Unlink before extraction keeps the hard-linked previous release immutable.
  tar --unlink-first -xzf "$archive" -C "$base/releases/$release"
else
  tar -xzf "$archive" -C "$base/releases/$release"
fi
if [ -f "$base/releases/$release/.deployment-manifest.json" ]; then
  /opt/dundun-pupu/node/bin/node "$base/prune-release.mjs" "$base/releases/$release"
fi
test -f "$base/releases/$release/server.js"
rm -f "$base/releases/$release/dist/client/deploy-release.txt"
printf '%s\n' "$release" > "$base/releases/$release/dist/client/deploy-release.txt"
rollback() {
  if [ -n "$previous" ]; then
    ln -sfn "$previous" "$base/current.next"
    mv -Tf "$base/current.next" "$base/current"
    systemctl restart dundun-pupu
  fi
}
trap rollback EXIT
ln -sfn "$base/releases/$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
systemctl restart dundun-pupu
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS --max-time 5 http://127.0.0.1:8092/ >/dev/null; then ready=1; break; fi
  sleep 1
done
[ "$ready" -eq 1 ]
trap - EXIT
rm -- "$archive"
echo "Activated $release"
