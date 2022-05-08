from http.server import HTTPServer, CGIHTTPRequestHandler

if __name__ == '__main__':
    try:
        CGIHTTPRequestHandler.cgi_directories = ['/cgi-bin']
        httpd = HTTPServer(('', 4040), CGIHTTPRequestHandler)
        print(f"Running server. Use [ctrl]-c to terminate.")

        httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\nReceived keyboard interrupt. Shutting down server.")
        httpd.socket.close()