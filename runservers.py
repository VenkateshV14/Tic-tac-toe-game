import subprocess
import threading

def run_server(port):
    subprocess.run(f"uvicorn main:app --reload --port {port}", shell=True)

ports = [8000, 8001, 8002]
threads = []

for port in ports:
    thread = threading.Thread(target=run_server, args=(port,))
    threads.append(thread)
    thread.start()

for thread in threads:
    thread.join()