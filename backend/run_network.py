import json
import os
import socket
from pathlib import Path

import uvicorn


ROOT_DIR = Path(__file__).resolve().parent.parent
NETWORK_CONFIG_PATH = ROOT_DIR / ".network.json"
DEFAULT_BACKEND_PORT = 8000


def pronadji_lan_host() -> str:
    if os.getenv("NETWORK_HOST"):
        return os.environ["NETWORK_HOST"]

    for target in ("8.8.8.8", "1.1.1.1", "192.168.0.1", "10.0.0.1"):
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

        try:
            sock.connect((target, 80))
            host = sock.getsockname()[0]

            if host and not host.startswith("127."):
                return host
        except OSError:
            pass
        finally:
            sock.close()

    return "127.0.0.1"


def port_je_slobodan(host: str, port: int) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        sock.bind((host, port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def pronadji_slobodan_port(host: str, pocetni_port: int) -> int:
    for port in range(pocetni_port, pocetni_port + 100):
        if port_je_slobodan(host, port):
            return port

    raise RuntimeError("Nije pronadjen slobodan backend port.")


def sacuvaj_network_config(host: str, port: int) -> None:
    postojeci_config = {}

    if NETWORK_CONFIG_PATH.exists():
        try:
            postojeci_config = json.loads(NETWORK_CONFIG_PATH.read_text())
        except json.JSONDecodeError:
            postojeci_config = {}

    config = {
        **postojeci_config,
        "backend": {
            "host": host,
            "port": port,
            "url": f"http://{host}:{port}",
        },
    }

    NETWORK_CONFIG_PATH.write_text(json.dumps(config, indent=2) + "\n")


if __name__ == "__main__":
    host = pronadji_lan_host()
    pocetni_port = int(os.getenv("BACKEND_PORT", str(DEFAULT_BACKEND_PORT)))
    port = pronadji_slobodan_port(host, pocetni_port)

    sacuvaj_network_config(host, port)

    print(f"Backend network URL: http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
