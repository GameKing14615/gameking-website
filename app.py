from flask import Flask, render_template

# Create a Flask web application instance
app = Flask(__name__)

# Define a route for the homepage ("/")
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/tictactoe')
def tictactoe():
    return render_template('tictactoe.html')

# This part runs the application when you execute the script
if __name__ == '__main__':
    app.run(debug=True) # debug=True allows automatic reloading on changes