import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:5000/api"
LOGIN_PAYLOAD = {"email": "demo.student@lms.com", "password": "Student@123"}


def _request(method: str, url: str, data=None, headers=None):
    req = urllib.request.Request(url, method=method.upper())
    if headers:
        for key, value in headers.items():
            req.add_header(key, value)
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")
        req.data = payload
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, body
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8")

def main():
    login_status, login_body = _request(
        "POST", f"{BASE}/auth/login", data=LOGIN_PAYLOAD
    )
    print("login status", login_status)
    print("login body", login_body)
    if login_status >= 400:
        return

    login_json = json.loads(login_body)
    token = login_json.get("data", {}).get("access_token")
    print("token prefix", (token[:20] + "...") if token else None)
    headers = {"Authorization": f"Bearer {token}"}
    lessons_status, lessons_body = _request(
        "GET", f"{BASE}/student/lessons", headers=headers
    )
    print("lessons status", lessons_status)
    print("lessons body", lessons_body)

if __name__ == "__main__":
    main()
