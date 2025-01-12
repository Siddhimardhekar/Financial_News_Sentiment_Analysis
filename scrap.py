from flask import Flask, jsonify, g
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from textblob import TextBlob
import sqlite3
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# Finnhub API key
api_key = "cu120l9r01qjiermt8tgcu120l9r01qjiermt8tgcu120l9r01qjiermt8u0"

# Portfolio symbols
portfolio = [
    {"name": "Apple Inc.", "symbol": "AAPL"},
    {"name": "Microsoft Corporation", "symbol": "MSFT"},
    {"name": "Google LLC", "symbol": "GOOGL"},
]

# Database setup
DATABASE = 'stock_recommendations.db'


def get_db():
    """Opens a new database connection if there is none yet for the current app context."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db


@app.teardown_appcontext
def close_connection(exception):
    """Closes the database connection after the request."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def init_db():
    """Initializes the database by creating the necessary table if it doesn't exist."""
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stock_recommendations (
                symbol TEXT PRIMARY KEY,
                recommendation TEXT,
                sentiment REAL,
                article_title TEXT,
                article_url TEXT
            )
        ''')
        db.commit()


# Call init_db() at startup
init_db()

# FinBERT sentiment analysis model
finbert = pipeline(
    "sentiment-analysis",
    model="yiyanghkust/finbert-tone",
    tokenizer="yiyanghkust/finbert-tone"
)


def get_finbert_sentiment(text):
    """Uses FinBERT to analyze sentiment of the given text and return a sentiment score."""
    try:
        result = finbert(text)
        label = result[0]['label']
        score = result[0]['score']
        if label.lower() == "neutral":
            return 0
        elif label.lower() == "positive":
            return score
        elif label.lower() == "negative":
            return -score
    except Exception as e:
        print(f"FinBERT error: {e}")
        return 0  # Return neutral if there's an error


def extract_keywords(text):
    """Uses TextBlob to extract relevant keywords from the text."""
    blob = TextBlob(text)
    return blob.noun_phrases


class RecommendationService:
    """Service Layer for handling database operations."""

    @staticmethod
    def get_recommendation_from_db(symbol):
        """Fetch a recommendation for a specific symbol."""
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM stock_recommendations WHERE symbol = ?", (symbol,))
        row = cursor.fetchone()
        if row:
            return {
                "symbol": row["symbol"],
                "recommendation": row["recommendation"],
                "sentiment": row["sentiment"],
                "article_title": row["article_title"],
                "article_url": row["article_url"]
            }
        return None

    @staticmethod
    def get_all_recommendations():
        """Fetch all recommendations."""
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM stock_recommendations")
        rows = cursor.fetchall()
        data = []
        for row in rows:
            data.append({
                "symbol": row["symbol"],
                "recommendation": row["recommendation"],
                "sentiment": row["sentiment"],
                "article_title": row["article_title"],
                "article_url": row["article_url"]
            })
        return data

    @staticmethod
    def upsert_recommendation(symbol, recommendation, sentiment, article_title, article_url):
        """Insert or update a recommendation."""
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO stock_recommendations (symbol, recommendation, sentiment, article_title, article_url)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(symbol) DO UPDATE SET
                recommendation=excluded.recommendation,
                sentiment=excluded.sentiment,
                article_title=excluded.article_title,
                article_url=excluded.article_url
        ''', (symbol, recommendation, sentiment, article_title, article_url))
        db.commit()


def analyze_stock(symbol):
    """Fetch and analyze stock news to generate a recommendation."""
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    url = f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={yesterday}&to={today}&token={api_key}"
    response = requests.get(url)

    if response.status_code != 200:
        return {"symbol": symbol, "error": "Failed to fetch news data"}

    news_data = response.json()[:10]
    results = []

    for news_item in news_data:
        article_url = news_item.get("url", "")
        summary = news_item.get("summary", "")
        headline = news_item.get("headline", "")
        title = headline
        content = summary

        if article_url:
            try:
                article_response = requests.get(article_url, timeout=10)
                if article_response.status_code == 200:
                    soup = BeautifulSoup(article_response.text, "html.parser")
                    content_div = soup.find("div", class_="caas-body")
                    content = content_div.text if content_div else summary
            except Exception as e:
                print(f"Error scraping {article_url}: {e}")

        sentiment_score = get_finbert_sentiment(content)
        keywords = extract_keywords(content)

        results.append({
            "title": title,
            "content": content,
            "url": article_url,
            "keywords": keywords,
            "sentiment": sentiment_score
        })

    avg_sentiment = sum([r["sentiment"] for r in results]) / len(results) if results else 0
    recommendation = determine_recommendation(avg_sentiment)

    return {
        "symbol": symbol,
        "recommendation": recommendation,
        "sentiment": avg_sentiment,
        "articles": results
    }


def determine_recommendation(sentiment):
    """Determine recommendation based on sentiment score."""
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


def update_recommendations():
    """Fetches news and updates recommendations for all stocks in the portfolio."""
    for company in portfolio:
        symbol = company["symbol"]
        result = analyze_stock(symbol)
        if "error" in result:
            continue

        for article in result["articles"]:
            RecommendationService.upsert_recommendation(
                symbol,
                result["recommendation"],
                result["sentiment"],
                article["title"],
                article["url"]
            )


# Scheduler to update recommendations periodically
scheduler = BackgroundScheduler()
scheduler.add_job(func=update_recommendations, trigger="interval", hours=2)
scheduler.start()

atexit.register(lambda: scheduler.shutdown())


@app.route("/calculate-recommendations", methods=["GET"])
def calculate_recommendations():
    """Trigger manual recommendation update."""
    update_recommendations()
    return jsonify({"status": "Recommendations updated."})


@app.route("/dashboard", methods=["GET"])
def dashboard():
    """Fetch data for the UI dashboard using the service."""
    data = RecommendationService.get_all_recommendations()
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=False)
