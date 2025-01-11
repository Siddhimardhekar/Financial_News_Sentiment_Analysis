from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from textblob import TextBlob
from supabase import create_client, Client

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Finnhub API key
api_key = "cu120l9r01qjiermt8tgcu120l9r01qjiermt8u0"

# Supabase client
supabase_url = "https://izgpjzhfuknxuafbewsr.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6Z3BqemhmdWtueHVhZmJld3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0OTUxMzEsImV4cCI6MjA1MjA3MTEzMX0.dw6emoPZoPSCv7uc_CFuRPWbWG4OJinQUznYgL2npF0"
supabase: Client = create_client(supabase_url, supabase_key)

# In-memory portfolio (for demonstration purposes)
portfolio = [
    {"name": "Apple Inc.", "symbol": "AAPL"},
    {"name": "Microsoft Corporation", "symbol": "MSFT"},
    {"name": "Google LLC", "symbol": "GOOGL"},
]

@app.route("/portfolio", methods=["GET"])
def get_portfolio():
    return jsonify(portfolio)

@app.route("/analyze/<symbol>", methods=["GET"])
def analyze(symbol):
    # Step 1: Query the Finnhub API
    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    url = f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={yesterday}&to={today}&token={api_key}"
    response = requests.get(url)

    # Step 2: Check if the API request was successful
    if response.status_code == 200:
        news_data = response.json()[:10]  # Limit to top 5 news entries
    else:
        return jsonify({"error": "Failed to retrieve news data"}), 500

    # Step 3: Initialize a data structure to store the results
    results = []

    # Step 4: Loop through the top 5 news entries and scrape content
    for news_item in news_data:
        article_url = news_item.get("url", "")
        summary = news_item.get("summary", "")
        headline = news_item.get("headline", "")

        if article_url:
            # Step 5: Scrape the content from the article URL
            try:
                article_response = requests.get(article_url, timeout=10)  # Add timeout to avoid hanging
                if article_response.status_code == 200:
                    soup = BeautifulSoup(article_response.text, "html.parser")

                    # Extract the title
                    title = soup.find("h1").text if soup.find("h1") else headline

                    # Extract the content (adjust the class based on the actual structure)
                    content_div = soup.find("div", class_="caas-body")
                    content = content_div.text if content_div else summary
                else:
                    title = headline
                    content = summary
            except Exception as e:
                print(f"Error scraping {article_url}: {e}")
                title = headline
                content = summary
        else:
            title = headline
            content = summary

        # Step 6: Store the results in a data structure
        results.append({"title": title, "content": content, "url": article_url})

    # Step 7: Perform Sentiment Analysis on the content
    def get_sentiment(text):
        analysis = TextBlob(text)
        return analysis.sentiment.polarity  # Returns a polarity score between -1 (negative) and 1 (positive)

    # Categorize articles based on sentiment
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

    # Initialize a dictionary to store categorized articles
    categorized_articles = {
        "Strong Buy": [],
        "Buy": [],
        "Hold": [],
        "Sell": [],
        "Strong Sell": [],
    }

    # Analyze each article and categorize it
    for result in results:
        sentiment = get_sentiment(result["content"])
        category = categorize_article(sentiment)
        categorized_articles[category].append(
            {"title": result["title"], "url": result["url"], "sentiment": sentiment}
        )

    # Step 8: Calculate overall sentiment
    total_sentiment = sum(get_sentiment(result["content"]) for result in results)
    average_sentiment = total_sentiment / len(results) if results else 0

    # Step 9: Map overall sentiment to investment recommendation
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

    # Step 10: Get relevant articles for the final recommendation
    relevant_articles = categorized_articles.get(recommendation, [])

    # Prepare the response
    response_data = {
        "symbol": symbol,
        "recommendation": recommendation,
        "overall_sentiment": average_sentiment,
        "relevant_articles": relevant_articles,
    }

    return jsonify(response_data)

@app.route("/calculate-recommendations", methods=["GET"])
def calculate_recommendations():
    recommendations = []

    for company in portfolio:
        symbol = company["symbol"]
        response = analyze(symbol)
        recommendation_data = response.get_json()
        recommendations.append({
            "symbol": symbol,
            "recommendation": recommendation_data["recommendation"],
            "sentiment": recommendation_data["overall_sentiment"],
        })

        # Store recommendation in Supabase
        supabase.table("stock_recommendations").upsert([
            {
                "symbol": symbol,
                "recommendation": recommendation_data["recommendation"],
                "sentiment": recommendation_data["overall_sentiment"],
            }
        ]).execute()

    return jsonify(recommendations)

if __name__ == "__main__":
    app.run(debug=True)