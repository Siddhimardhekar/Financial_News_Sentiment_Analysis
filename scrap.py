from flask import Flask, request, jsonify, g
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from textblob import TextBlob
import sqlite3

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Finnhub API key (for demo purposes)
api_key = "cu120l9r01qjiermt8tgcu120l9r01qjiermt8u0"

# In-memory portfolio (for demonstration purposes)
portfolio = [
    {"name": "Apple Inc.", "symbol": "AAPL"},
    {"name": "Microsoft Corporation", "symbol": "MSFT"},
    {"name": "Google LLC", "symbol": "GOOGL"},
]

# -----------------------------
# SQLite Database Setup
# -----------------------------
DATABASE = 'stock_recommendations.db'

def get_db():
    """
    Opens a new database connection if there is none yet for the current application context.
    """
    db = getattr(g, '_database', None)
    if db is None:
        # This creates (or opens) the database file in the current directory.
        db = g._database = sqlite3.connect(DATABASE)
        # Make rows behave like dictionaries (keyed by column name)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """
    Closes the database connection after the request.
    """
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """
    Initializes the database by creating the necessary table if it doesn't exist.
    """
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stock_recommendations (
                symbol TEXT PRIMARY KEY,
                recommendation TEXT,
                sentiment REAL
            )
        ''')
        db.commit()
        print("Database initialized.")

# Call init_db() once when starting up.
init_db()

def get_recommendation_from_db(symbol):
    """
    Returns a recommendation record for the given symbol from the database,
    or None if not found.
    """
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM stock_recommendations WHERE symbol = ?", (symbol,))
    row = cursor.fetchone()
    if row:
        return {
            "symbol": row["symbol"],
            "recommendation": row["recommendation"],
            "overall_sentiment": row["sentiment"]
        }
    return None

# -----------------------------
# Endpoints and Helper Functions
# -----------------------------

@app.route("/portfolio", methods=["GET"])
def get_portfolio():
    """Return the in-memory portfolio."""
    return jsonify(portfolio)

def analyze_stock(symbol):
    """
    Performs analysis for a single stock symbol:
      - Retrieves company news from Finnhub.
      - Scrapes article details.
      - Performs sentiment analysis on news content.
      - Determines an overall recommendation.
    Returns a dictionary containing the result.
    """
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    url = f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={yesterday}&to={today}&token={api_key}"
    response = requests.get(url)
    
    if response.status_code == 200:
        news_data = response.json()[:10]  # Use top 10 entries
    else:
        return {"symbol": symbol, "error": "Failed to retrieve news data"}
    
    results = []
    for news_item in news_data:
        article_url = news_item.get("url", "")
        summary = news_item.get("summary", "")
        headline = news_item.get("headline", "")
        if article_url:
            try:
                article_response = requests.get(article_url, timeout=10)
                if article_response.status_code == 200:
                    soup = BeautifulSoup(article_response.text, "html.parser")
                    title = soup.find("h1").text if soup.find("h1") else headline
                    content_div = soup.find("div", class_="caas-body")
                    content = content_div.text if content_div else summary
                else:
                    title, content = headline, summary
            except Exception as e:
                print(f"Error scraping {article_url}: {e}")
                title, content = headline, summary
        else:
            title, content = headline, summary
        
        results.append({"title": title, "content": content, "url": article_url})
    
    # Sentiment analysis
    def get_sentiment(text):
        analysis = TextBlob(text)
        return analysis.sentiment.polarity
    
    def categorize_article(sentiment):
        if sentiment > 0.5:
            return "Strong Buy"
        elif sentiment > 0.1:
            return "Buy"
        elif sentiment > -0.1:
            return "Hold"
        elif sentiment > -0.5:
            return "Sell"
        else:
            return "Strong Sell"
    
    categorized_articles = {
        "Strong Buy": [],
        "Buy": [],
        "Hold": [],
        "Sell": [],
        "Strong Sell": [],
    }
    
    for result in results:
        s = get_sentiment(result["content"])
        category = categorize_article(s)
        categorized_articles[category].append({
            "title": result["title"],
            "url": result["url"],
            "sentiment": s
        })
    
    total_sentiment = sum(get_sentiment(r["content"]) for r in results)
    average_sentiment = total_sentiment / len(results) if results else 0
    
    def get_recommendation(sentiment):
        if sentiment > 0.5:
            return "Strong Buy"
        elif sentiment > 0.1:
            return "Buy"
        elif sentiment > -0.1:
            return "Hold"
        elif sentiment > -0.5:
            return "Sell"
        else:
            return "Strong Sell"
    
    recommendation = get_recommendation(average_sentiment)
    relevant_articles = categorized_articles.get(recommendation, [])
    
    return {
        "symbol": symbol,
        "recommendation": recommendation,
        "overall_sentiment": average_sentiment,
        "relevant_articles": relevant_articles
    }

@app.route("/analyze/<symbol>", methods=["GET"])
def analyze(symbol):
    """
    Endpoint to analyze a single stock.
    First, it checks the SQLite database for a cached recommendation.
    If found, it returns the cached value.
    Otherwise, it performs analysis, caches the result, and returns it.
    """
    # First, check the database
    cached = get_recommendation_from_db(symbol)
    if cached:
        return jsonify(cached)
    
    # Not found in the database; calculate now
    data = analyze_stock(symbol)
    if "error" in data:
        return jsonify({"error": data["error"]}), 500
    
    # Upsert into SQLite (cache the newly calculated value)
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute('''
            INSERT INTO stock_recommendations (symbol, recommendation, sentiment)
            VALUES (?, ?, ?)
            ON CONFLICT(symbol) DO UPDATE SET
                recommendation=excluded.recommendation,
                sentiment=excluded.sentiment;
        ''', (
            symbol,
            data["recommendation"],
            data["overall_sentiment"]
        ))
        db.commit()
    except Exception as e:
        print(f"Error upserting into SQLite for symbol {symbol}: {e}")
    
    return jsonify(data)

@app.route("/calculate-recommendations", methods=["GET"])
def calculate_recommendations():
    """
    For every company in the portfolio:
      - First checks if the recommendation exists in the database.
      - If not, it performs analysis and caches the result.
      - Collects and returns the data to the frontend.
    """
    recommendations = []
    db = get_db()
    cursor = db.cursor()
    
    for company in portfolio:
        symbol = company["symbol"]
        # Check DB first
        cached = get_recommendation_from_db(symbol)
        if cached:
            recommendation_data = cached
        else:
            recommendation_data = analyze_stock(symbol)
            if "error" in recommendation_data:
                continue
            try:
                cursor.execute('''
                    INSERT INTO stock_recommendations (symbol, recommendation, sentiment)
                    VALUES (?, ?, ?)
                    ON CONFLICT(symbol) DO UPDATE SET
                        recommendation=excluded.recommendation,
                        sentiment=excluded.sentiment;
                ''', (
                    symbol,
                    recommendation_data["recommendation"],
                    recommendation_data["overall_sentiment"]
                ))
            except Exception as e:
                print(f"Error upserting into SQLite for symbol {symbol}: {e}")
                continue
        
        recommendations.append({
            "name": company["name"],
            "symbol": symbol,
            "recommendation": recommendation_data["recommendation"],
            "sentiment": recommendation_data["overall_sentiment"],
            "articles": recommendation_data.get("relevant_articles", [])
        })
    
    db.commit()
    return jsonify(recommendations)

if __name__ == "__main__":
    # Ensure the database is initialized before starting the Flask server.
    init_db()
    app.run(debug=False)
