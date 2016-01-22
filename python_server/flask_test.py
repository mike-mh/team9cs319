from flask import Flask
app = Flask(__name__)

# Go to 'http://localhost:5000' to view this
@app.route("/")
def hello():
    return "YOUR APP HERE"

if __name__ == "__main__":
    app.run()
