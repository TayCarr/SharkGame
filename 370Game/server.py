import http.server
import socketserver
import webbrowser
from sys import exit

#command line to run: python3 -m http.server 8000
#then http://localhost:8000

try:
    PORT = 8000

    handler = http.server.SimpleHTTPRequestHandler

    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("Server started at localhost:" + str(PORT))
        webbrowser.open_new_tab(f'http://localhost:{PORT}')
        httpd.serve_forever()

except KeyboardInterrupt:
    exit()
