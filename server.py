"""
TagaDetect Local Development Server
Run with: python server.py
Serves the web application on http://localhost:8080
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Clean logging
        sys.stdout.write(f"[TagaDetect] {self.address_string()} - {format%args}\n")
        sys.stdout.flush()

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/login.html"
        print(f"=" * 60)
        print(f"  TagaDetect Application Server Running!")
        print(f"  Local URL: {url}")
        print(f"  Directory: {DIRECTORY}")
        print(f"=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down TagaDetect server...")
            httpd.shutdown()
