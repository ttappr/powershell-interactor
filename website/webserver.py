from http.server import HTTPServer

if __name__ == '__main__':
    try:
        httpd = HTTPServer(('', 4040), None)
        print(f"Running server. Use [ctrl]-c to terminate.")

        httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\nReceived keyboard interrupt. Shutting down server.")
        httpd.socket.close()