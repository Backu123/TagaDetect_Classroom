import warnings
warnings.filterwarnings('ignore')

"""
TagaDetect Application & Inference Server
Run with: python server.py
Serves the web application on http://localhost:8080 and provides the ML model API endpoint on /api/detect
"""

import http.server
import socketserver
import json
import os
import sys
import traceback

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

BUNDLE_PATHS = [
    os.path.join(DIRECTORY, "model_bundle"),
    os.path.join(DIRECTORY, "..", "Downloads", "TagaDetect_Model_Bundle"),
    r"C:\Users\ASUS\Downloads\TagaDetect_Model_Bundle",
]

detector = None
model_error = None

def init_detector():
    global detector, model_error
    bundle_dir = None
    for p in BUNDLE_PATHS:
        if os.path.exists(os.path.join(p, "ensemble_config.json")):
            bundle_dir = os.path.abspath(p)
            break

    if not bundle_dir:
        model_error = "Model bundle directory not found."
        print(f"[TagaDetect] WARNING: {model_error}")
        return

    print(f"[TagaDetect] Loading ML Model Bundle from: {bundle_dir} ...")
    try:
        if bundle_dir not in sys.path:
            sys.path.insert(0, bundle_dir)
        from taga_inference import TagaDetector
        detector = TagaDetector(bundle_dir)
        print("[TagaDetect] SUCCESS: TagaDetect AI Ensemble Model loaded and ready!")
    except Exception as e:
        model_error = str(e)
        print(f"[TagaDetect] ERROR loading model: {e}")
        traceback.print_exc()

class TagaServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/status" or self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            status = {
                "status": "online",
                "modelLoaded": detector is not None,
                "modelError": model_error,
                "bundleDir": getattr(detector, "dir", None)
            }
            self.wfile.write(json.dumps(status).encode("utf-8"))
            return

        super().do_GET()

    def do_POST(self):
        if self.path in ("/api/detect", "/api/predict", "/predict"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")

            try:
                data = json.loads(body) if body else {}
                text = data.get("text", "")
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Invalid JSON payload: {e}"}).encode("utf-8"))
                return

            if not detector:
                self.send_response(503)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "Model not loaded on server",
                    "details": model_error
                }).encode("utf-8"))
                return

            try:
                result = detector.predict_detailed(text)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                print(f"[TagaDetect] Inference error: {e}")
                traceback.print_exc()
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Prediction failed: {e}"}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        sys.stdout.write(f"[TagaDetect] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    init_detector()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), TagaServerHandler) as httpd:
        url = f"http://localhost:{PORT}/detector.html"
        print("=" * 60)
        print("  TagaDetect Application Server Running with ML Engine!")
        print(f"  AI Detector URL: {url}")
        print(f"  Classroom Portal: http://localhost:{PORT}/login.html")
        print(f"  Inference API:    http://localhost:{PORT}/api/detect")
        print(f"  Directory:        {DIRECTORY}")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down TagaDetect server...")
            httpd.shutdown()
