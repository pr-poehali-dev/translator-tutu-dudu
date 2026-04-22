"""
Перевод текста через MyMemory API (бесплатный, без ключа).
Поддерживает перевод между основными языками мира.
"""

import json
import urllib.request
import urllib.parse
import urllib.error


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Переводит текст через MyMemory API."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if event.get("httpMethod") != "POST":
        return {
            "statusCode": 405,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Method not allowed"}),
        }

    body = json.loads(event.get("body") or "{}")
    text = body.get("text", "").strip()
    source = body.get("source", "ru")
    target = body.get("target", "en")

    if not text:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "text is required"}),
        }

    if len(text) > 500:
        text = text[:500]

    lang_pair = f"{source}|{target}"
    params = urllib.parse.urlencode({
        "q": text,
        "langpair": lang_pair,
        "de": "lingua-app@poehali.dev",
    })
    url = f"https://api.mymemory.translated.net/get?{params}"

    req = urllib.request.Request(url, method="GET")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

            status = data.get("responseStatus", 500)
            if status != 200:
                return {
                    "statusCode": 502,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": data.get("responseDetails", "Translation failed")}),
                }

            translated = data["responseData"]["translatedText"]

            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({
                    "translatedText": translated,
                    "source": source,
                    "target": target,
                }),
            }

    except Exception as e:
        return {
            "statusCode": 502,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Network error: {str(e)}"}),
        }
