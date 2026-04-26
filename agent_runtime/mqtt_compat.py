from typing import Any

try:
    import paho.mqtt.client as mqtt
except ImportError:  # pragma: no cover - keeps local tests working without the dependency
    class _FallbackClient:
        def __init__(self, client_id: str | None = None):
            self.client_id = client_id

        def connect(self, *args: Any, **kwargs: Any) -> None:
            return None

        def subscribe(self, *args: Any, **kwargs: Any) -> None:
            return None

        def publish(self, *args: Any, **kwargs: Any) -> None:
            return None

        def loop_forever(self) -> None:
            return None

    class mqtt:  # type: ignore[no-redef]
        Client = _FallbackClient
