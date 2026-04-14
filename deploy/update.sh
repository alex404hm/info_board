#!/usr/bin/env bash
# =============================================================================
#  info-board-update.sh
#  Git update + build script for tec-info-board (Next.js / pnpm)
#  Designed for Raspberry Pi 5 / Raspberry Pi OS (systemd)
#
#  What this script does, in order:
#    1. Acquires an exclusive lock so concurrent runs are impossible
#    2. Fetches remote git metadata (no checkout yet)
#    3. Compares local HEAD vs remote HEAD on $GIT_BRANCH
#    4. If up-to-date → exits cleanly (app start is handled separately)
#    5. If outdated  → backs up .env/.env.local, pulls, restores them,
#                      runs pnpm install, then pnpm build
#
#  NOTE: This script does NOT start or restart the app.
#        Your existing app service handles `pnpm start`.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PROJECT_DIR="/home/admin/Desktop/infoboard"  # Absolute path to repo on Pi
GIT_BRANCH="main"                             # Branch to track
LOG_FILE="/var/log/info-board-update.log"     # Log destination
LOCK_FILE="/var/lock/info-board-update.lock"  # flock target
PNPM_BIN="$(command -v pnpm 2>/dev/null || echo '/usr/local/bin/pnpm')"
NODE_ENV="production"

# Files that must NEVER be overwritten or deleted by a git pull
PROTECTED_FILES=".env .env.local"
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------
_ts()  { date '+%Y-%m-%d %H:%M:%S'; }
log()  { echo "[$(_ts)] [INFO]  $*" | tee -a "$LOG_FILE"; }
warn() { echo "[$(_ts)] [WARN]  $*" | tee -a "$LOG_FILE"; }
err()  { echo "[$(_ts)] [ERROR] $*" | tee -a "$LOG_FILE" >&2; }
die()  { err "$*"; exit 1; }

# ---------------------------------------------------------------------------
# Lock — prevent overlapping runs (boot run + timer firing simultaneously)
# ---------------------------------------------------------------------------
exec 9>"$LOCK_FILE"
if ! flock --exclusive --nonblock 9; then
  log "Another instance is already running (lock held). Exiting."
  exit 0
fi
trap 'flock --unlock 9' EXIT

# ---------------------------------------------------------------------------
# Sanity checks
# ---------------------------------------------------------------------------
[[ -d "$PROJECT_DIR/.git" ]] || die "PROJECT_DIR '$PROJECT_DIR' is not a git repo."
[[ -x "$PNPM_BIN" ]]        || die "pnpm not found at '$PNPM_BIN'. Install pnpm first."
command -v git  &>/dev/null  || die "git is not installed."
command -v node &>/dev/null  || die "node is not installed."

log "========================================================"
log " info-board update check started"
log "  Project : $PROJECT_DIR"
log "  Branch  : $GIT_BRANCH"
log "  pnpm    : $PNPM_BIN"
log "========================================================"

cd "$PROJECT_DIR"

# ---------------------------------------------------------------------------
# Step 1 — Fetch remote metadata only (no merge yet)
# ---------------------------------------------------------------------------
log "Fetching remote origin/$GIT_BRANCH ..."
git fetch --quiet origin "$GIT_BRANCH" 2>&1 | tee -a "$LOG_FILE" || \
  die "git fetch failed. Check network connectivity and repo permissions."

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse "origin/$GIT_BRANCH")

log "Local  HEAD : $LOCAL_HASH"
log "Remote HEAD : $REMOTE_HASH"

# ---------------------------------------------------------------------------
# Step 2 — Skip if already up-to-date
# ---------------------------------------------------------------------------
if [[ "$LOCAL_HASH" == "$REMOTE_HASH" ]]; then
  log "Already up-to-date. No update required."
  exit 0
fi

COMMIT_COUNT=$(git log --oneline "${LOCAL_HASH}..origin/${GIT_BRANCH}" 2>/dev/null | wc -l)
log "Update available: $COMMIT_COUNT new commit(s)."
git log --oneline "${LOCAL_HASH}..origin/${GIT_BRANCH}" 2>/dev/null | tee -a "$LOG_FILE"

# ---------------------------------------------------------------------------
# Step 3 — Back up all protected files before touching the working tree
# ---------------------------------------------------------------------------
BACKUP_DIR=$(mktemp -d /tmp/info-board-env-backup.XXXXXX)
log "Backing up protected files to $BACKUP_DIR ..."

for f in $PROTECTED_FILES; do
  if [[ -f "$PROJECT_DIR/$f" ]]; then
    cp "$PROJECT_DIR/$f" "$BACKUP_DIR/$f"
    log "  Backed up: $f"
  fi
done

# _restore_protected is called both on clean exit and on any error
_restore_protected() {
  log "Restoring protected files from backup ..."
  for f in $PROTECTED_FILES; do
    if [[ -f "$BACKUP_DIR/$f" ]]; then
      cp "$BACKUP_DIR/$f" "$PROJECT_DIR/$f"
      log "  Restored: $f"
    fi
  done
  rm -rf "$BACKUP_DIR"
}

# Ensure we never leave the project without its .env even if something fails
trap '_restore_protected; flock --unlock 9' EXIT

# ---------------------------------------------------------------------------
# Step 4 — Pull latest changes
# ---------------------------------------------------------------------------
log "Pulling origin/$GIT_BRANCH ..."
git pull --ff-only origin "$GIT_BRANCH" 2>&1 | tee -a "$LOG_FILE" || \
  die "git pull failed. Check for local modifications blocking fast-forward."

# Restore .env/.env.local immediately — before anything else reads them
_restore_protected

# Reset trap now that env files are safely restored
trap 'flock --unlock 9' EXIT

log "Pull complete. New HEAD: $(git rev-parse HEAD)"

# ---------------------------------------------------------------------------
# Step 5 — Install dependencies
# ---------------------------------------------------------------------------
log "Installing dependencies with pnpm ..."
NODE_ENV="$NODE_ENV" "$PNPM_BIN" install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE" || \
  die "pnpm install failed. Check pnpm-lock.yaml consistency."

# ---------------------------------------------------------------------------
# Step 6 — Build
# ---------------------------------------------------------------------------
log "Building project (pnpm build) ..."
NODE_ENV="$NODE_ENV" "$PNPM_BIN" build 2>&1 | tee -a "$LOG_FILE" || \
  die "pnpm build failed. Check build output above."

log "========================================================"
log " Build complete. Your app service will pick up the new build."
log "========================================================"