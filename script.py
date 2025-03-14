import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

def extract_keywords(prompt):
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(prompt)
    keywords = [word for word in words if word.lower() not in stop_words]
    return keywords[:3]  # Select top 3 keywords


