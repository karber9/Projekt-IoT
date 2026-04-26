import os
from pathlib import Path


def ensure_crypto_keys(logger) -> str | None:
    """
    Generates a signing key pair on first start and stores it on disk.
    On subsequent starts, it reuses the existing private key and derives
    the public key from it.
    """
    key_dir = Path(os.getenv("AGENT_KEY_DIR", "/app/keys"))
    private_key_path = key_dir / "signing_private_key.hex"
    public_key_path = key_dir / "signing_public_key.hex"

    key_dir.mkdir(parents=True, exist_ok=True)

    try:
        from nacl.signing import SigningKey
    except ImportError:
        logger.warning("PyNaCl is not available; key generation skipped.")
        return None

    if private_key_path.exists():
        private_key_hex = private_key_path.read_text(encoding="utf-8").strip()
        signing_key = SigningKey(bytes.fromhex(private_key_hex))
        public_key_hex = signing_key.verify_key.encode().hex()
        logger.info("Loaded existing crypto keypair from %s", key_dir)
    else:
        signing_key = SigningKey.generate()
        private_key_hex = signing_key.encode().hex()
        public_key_hex = signing_key.verify_key.encode().hex()

        private_key_path.write_text(private_key_hex, encoding="utf-8")
        public_key_path.write_text(public_key_hex, encoding="utf-8")

        try:
            os.chmod(private_key_path, 0o600)
            os.chmod(public_key_path, 0o644)
        except OSError:
            pass

        logger.info("Generated new crypto keypair in %s", key_dir)

    if not public_key_path.exists():
        public_key_path.write_text(public_key_hex, encoding="utf-8")

    return public_key_hex
