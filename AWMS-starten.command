#!/bin/zsh
# AWMS starten — Doppelklick genügt.
# Dieses Terminal-Fenster IST der Server: offen lassen. Schließen beendet AWMS.
cd "$(dirname "$0")"

if curl -s --max-time 1 http://localhost:4100/ > /dev/null 2>&1; then
  echo "AWMS läuft schon — öffne den Browser."
  open "http://localhost:4100"
  exit 0
fi

echo "Starte AWMS …"
echo "Dieses Fenster offen lassen — es ist der Server. Schließen beendet AWMS."

# Browser öffnen, sobald der Server antwortet (max. ~10 s warten).
(
  for i in {1..50}; do
    if curl -s --max-time 1 http://localhost:4100/ > /dev/null 2>&1; then
      open "http://localhost:4100"
      exit 0
    fi
    sleep 0.2
  done
) &

exec node app/server.mjs
