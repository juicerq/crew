import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


def arguments():
    parser = argparse.ArgumentParser(description="Search or read marketplace API documentation with Firecrawl.")
    commands = parser.add_subparsers(dest="operation", required=True)
    search = commands.add_parser("search", help="Search without scraping results.")
    search.add_argument("query")
    search.add_argument("--limit", type=int, choices=range(1, 11), default=5)
    scrape = commands.add_parser("scrape", help="Read a documentation URL as Markdown.")
    scrape.add_argument("url")
    scrape.add_argument("--wait-ms", type=int, metavar="0..10000")
    scrape.add_argument("--fresh", action="store_true")
    args = parser.parse_args()

    if args.operation == "search" and not args.query.strip():
        parser.error("query must contain text")

    if args.operation == "scrape":
        if args.wait_ms is not None and not 0 <= args.wait_ms <= 10000:
            parser.error("wait-ms must be between 0 and 10000")

        try:
            url = urllib.parse.urlsplit(args.url)
        except ValueError:
            parser.error("url must be a valid HTTP(S) URL")

        if url.scheme not in ("http", "https") or not url.hostname or url.username or url.password:
            parser.error("url must be an HTTP(S) URL without embedded credentials")

    return args


def request_payload(args):
    if args.operation == "search":
        return {"query": args.query, "limit": args.limit, "timeout": 60000}

    hostname = urllib.parse.urlsplit(args.url).hostname
    tiktok_shop = hostname == "tiktokshop.com" or hostname.endswith(".tiktokshop.com")
    wait_ms = args.wait_ms

    if wait_ms is None:
        wait_ms = 5000 if tiktok_shop else 0

    payload = {"url": args.url, "formats": ["markdown"], "waitFor": wait_ms, "timeout": 60000}

    if args.fresh or tiktok_shop:
        payload["maxAge"] = 0

    return payload


def service_details(response):
    if not isinstance(response, dict):
        return {"credits_used": None}

    data = response.get("data")
    metadata = data.get("metadata") if isinstance(data, dict) else None
    credits = metadata.get("creditsUsed") if isinstance(metadata, dict) else None
    details = {"credits_used": response.get("creditsUsed", credits)}
    warnings = []

    for source in (response, data):
        if not isinstance(source, dict):
            continue

        for key in ("warning", "warnings"):
            value = source.get(key)

            if isinstance(value, str):
                warnings.append(value)
            elif isinstance(value, list):
                warnings.extend(item for item in value if isinstance(item, str))

    if warnings:
        details["warnings"] = warnings

    return details


def normalize_response(operation, payload, response):
    if not isinstance(response, dict) or response.get("success") is not True:
        if isinstance(response, dict):
            raise ValueError(str(response.get("error", "Firecrawl did not confirm success")))

        raise ValueError("Firecrawl returned an invalid response")

    data = response.get("data")

    if not isinstance(data, dict):
        raise ValueError("Firecrawl returned invalid data")

    result = {"success": True, "operation": operation, **service_details(response)}

    if operation == "search":
        rows = data.get("web")

        if not isinstance(rows, list):
            raise ValueError("Firecrawl returned invalid search results")

        results = []

        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get("url"), str):
                raise ValueError("Firecrawl returned a search result without a URL")

            for field in ("title", "description"):
                if field in row and not isinstance(row[field], str):
                    raise ValueError("Firecrawl returned invalid search text")

            results.append({key: row[key] for key in ("url", "title", "description", "position") if key in row})

        result.update(query=payload["query"], results=results)
        return result

    markdown = data.get("markdown")
    metadata = data.get("metadata")

    if not isinstance(metadata, dict):
        raise ValueError("Firecrawl returned no source metadata")

    source_status = metadata.get("statusCode")

    if not isinstance(source_status, int) or isinstance(source_status, bool):
        raise ValueError("Firecrawl returned no valid source HTTP status")

    result.update(
        url=metadata.get("url", payload["url"]),
        title=metadata.get("title"),
        source_status=source_status,
        cached_at=metadata.get("cachedAt"),
        markdown=markdown,
    )

    if source_status >= 400:
        result.update(success=False, error=f"Documentation source returned HTTP {source_status}")
        return result

    if not isinstance(markdown, str) or not markdown.strip():
        raise ValueError("Firecrawl returned no readable Markdown")

    return result


def main():
    args = arguments()
    payload = request_payload(args)
    headers = {"Content-Type": "application/json"}
    api_key = os.environ.get("FIRECRAWL_API_KEY", "").strip()

    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    request = urllib.request.Request(
        f"https://api.firecrawl.dev/v2/{args.operation}",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    response_json = None

    try:
        with urllib.request.urlopen(request, timeout=65) as response:
            response_json = json.load(response)
            result = normalize_response(args.operation, payload, response_json)
    except urllib.error.HTTPError as error:
        try:
            response_json = json.load(error)
        except (ValueError, OSError):
            response_json = None

        message = str(error.reason)

        if isinstance(response_json, dict):
            message = str(response_json.get("error", response_json.get("message", message)))

        result = {
            "success": False,
            "operation": args.operation,
            "http_status": error.code,
            "error": message,
            **service_details(response_json),
        }
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as error:
        result = {"success": False, "operation": args.operation, "error": str(error), **service_details(response_json)}

    if api_key and "error" in result:
        result["error"] = result["error"].replace(api_key, "[redacted]")

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
