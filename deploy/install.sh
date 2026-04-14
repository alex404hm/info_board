#!/usr/bin/env bash
# =============================================================================
#  install.sh — Deploy the info-board systemd units to the Pi
#
#  Run this script once on the Raspberry Pi as root:
#    sudo bash deploy/install.sh
# =============================================================================

set -euo pipefail

DEPLOY_DIR="/home/admin/Desktop/infoboard/deploy"
SYSTEMD_DIR="/etc/systemd/system"

echo "[install] Copying systemd units ..."
cp "$DEPLOY_DIR/info-board.service"         "$SYSTEMD_DIR/"
cp "$DEPLOY_DIR/info-board-update.service"  "$SYSTEMD_DIR/"
cp "$DEPLOY_DIR/info-board-update.timer"    "$SYSTEMD_DIR/"

echo "[install] Making update script executable ..."
chmod +x "$DEPLOY_DIR/update.sh"

echo "[install] Reloading systemd daemon ..."
systemctl daemon-reload

echo "[install] Enabling units ..."
# The app service is started/restarted by the update script — just enable it.
systemctl enable info-board.service
# Enable and start the timer (fires at boot + every hour).
systemctl enable --now info-board-update.timer

echo ""
echo "Done. Useful commands:"
echo "  systemctl status  info-board"
echo "  systemctl status  info-board-update"
echo "  journalctl -u     info-board -f"
echo "  journalctl -u     info-board-update -f"
echo "  systemctl list-timers info-board-update.timer"
echo ""
echo "To trigger an update manually:"
echo "  sudo systemctl start info-board-update.service"
