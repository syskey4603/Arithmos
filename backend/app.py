import math
import datetime
import random
import re
from functools import wraps

import requests
from flask import Flask, request, jsonify, g
from flask_cors import CORS

try:
    from sympy import sympify, simplify
    sympy_loaded = True
except:
    sympy_loaded = False

SUPABASE_URL = "https://wyddqwmoltzmasxerbpn.supabase.co"
SUPABASE_KEY = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
                "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGRxd21vbHR6bWFzeGVyYnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjQ0MDYsImV4cCI6MjA5MDQ0MDQwNn0."
                "iCw4oxJ7XRMlxcZczKqXU4iBMV2v6PEm4ZGxp-T6cAY")

DB = f"{SUPABASE_URL}/rest/v1"
AUTH_URL = f"{SUPABASE_URL}/auth/v1"

TOPICS = ["Number Theory", "Algebra", "Combinatorics", "Geometry", "Probability", "Sequences"]

DIFF_RATINGS = {"Easy": 1100, "Medium": 1350, "Hard": 1650}

app = Flask(__name__)
CORS(app)

def get_headers(extra=None):
    h = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {g.token}",
        "Content-Type": "application/json"
    }
    if extra:
        h.update(extra)
    return h

def db_select(table, params):
    res = requests.get(f"{DB}/{table}", headers=get_headers(), params=params, timeout=10)
    return res.json()

def db_insert(table, data):
    res = requests.post(f"{DB}/{table}", headers=get_headers({"Prefer": "return=representation"}), json=data, timeout=10)
    return res.json() if res.text else None

def db_update(table, data, match):
    res = requests.patch(f"{DB}/{table}", headers=get_headers({"Prefer": "return=representation"}), params=match, json=data, timeout=10)
    return res.json() if res.text else None

def db_upsert(table, data, conflict_col):
    res = requests.post(
        f"{DB}/{table}",
        headers=get_headers({"Prefer": "resolution=merge-duplicates,return=representation"}),
        params={"on_conflict": conflict_col},
        json=data,
        timeout=10
    )
    return res.json() if res.text else None

def login_required(fn):
    @wraps(fn)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Not logged in"}), 401
        token = auth[7:]
        check = requests.get(f"{AUTH_URL}/user", headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {token}"})
        if check.status_code != 200:
            return jsonify({"error": "Session expired, please log in again"}), 401
        g.token = token
        g.user = check.json()
        return fn(*args, **kwargs)
    return decorated

def calc_elo(player_elo, difficulty, correct, time_taken):
    problem_rating = DIFF_RATINGS.get(difficulty, 1200)
    expected = 1 / (1 + 10 ** ((problem_rating - player_elo) / 400))
    score = 1 if correct else 0
    time_bonus = max(0, (120 - time_taken) // 30) if correct else 0
    delta = round(32 * (score - expected)) + time_bonus
    new_elo = max(800, player_elo + delta)
    return delta, new_elo

def norm_answer(answer):
    answer = str(answer).lower()
    for ch in [",", " ", "\t", "\n"]:
        answer = answer.replace(ch, "")
    return answer

def check_answer(user_answer, correct_answer):
    if norm_answer(user_answer) == norm_answer(correct_answer):
        return True
    if sympy_loaded:
        try:
            u = user_answer.replace("^", "**")
            c = correct_answer.replace("^", "**")
            u = re.sub(r"√(\w+)", r"sqrt(\1)", u)
            c = re.sub(r"√(\w+)", r"sqrt(\1)", c)
            if simplify(sympify(u) - sympify(c)) == 0:
                return True
        except:
            pass
    return False

def get_topic_elo(user_id, topic):
    rows = db_select("topic_ratings", {"select": "elo", "user_id": f"eq.{user_id}", "topic": f"eq.{topic}"})
    if rows and len(rows) > 0:
        return rows[0]["elo"]
    return 1200

def save_topic_elo(user_id, topic, new_elo):
    db_upsert("topic_ratings", {
        "user_id": user_id,
        "topic": topic,
        "elo": max(800, new_elo),
        "updated_at": datetime.datetime.utcnow().isoformat() + "Z"
    }, "user_id,topic")

@app.get("/api/health")
def health():
    return jsonify({"ok": True})

@app.get("/api/problems")
@login_required
def get_problems():
    all_problems = db_select("problems", {"select": "*", "order": "created_at.asc"})
    solved_rows = db_select("submissions", {
        "select": "problem_id",
        "user_id": f"eq.{g.user['id']}",
        "correct": "eq.true"
    })
    solved_ids = set(str(s["problem_id"]) for s in solved_rows)

    result = []
    for p in all_problems:
        p_copy = dict(p)
        if str(p_copy.get("id")) not in solved_ids:
            p_copy.pop("answer", None)
            p_copy.pop("explanation", None)
        result.append(p_copy)

    return jsonify({"problems": result, "solved": list(solved_ids)})

@app.get("/api/adaptive")
@login_required
def get_adaptive_problem():
    topic = request.args.get("topic", "").strip()

    if not topic or topic not in TOPICS:
        stored_rows = db_select("topic_ratings", {"select": "topic,elo", "user_id": f"eq.{g.user['id']}"})
        stored = {r["topic"]: r["elo"] for r in stored_rows}
        all_elos = {t: stored.get(t, 1200) for t in TOPICS}
        topic = min(all_elos, key=all_elos.get)

    topic_elo = get_topic_elo(g.user["id"], topic)

    solved_rows = db_select("submissions", {
        "select": "problem_id",
        "user_id": f"eq.{g.user['id']}",
        "correct": "eq.true"
    })
    solved_ids = set(str(r["problem_id"]) for r in solved_rows)

    topic_problems = db_select("problems", {"select": "*", "topic": f"eq.{topic}"})

    in_range = []
    for p in topic_problems:
        if str(p["id"]) not in solved_ids:
            p_rating = DIFF_RATINGS.get(p.get("difficulty", "Medium"), 1200)
            if abs(p_rating - topic_elo) <= 200:
                in_range.append(p)

    if not in_range:
        in_range = [p for p in topic_problems if str(p["id"]) not in solved_ids]
    if not in_range:
        in_range = topic_problems
    if not in_range:
        return jsonify({"error": "No problems available"}), 404

    chosen = random.choice(in_range)
    chosen = dict(chosen)
    if str(chosen.get("id")) not in solved_ids:
        chosen.pop("answer", None)
        chosen.pop("explanation", None)

    return jsonify({**chosen, "topic_elo": topic_elo, "suggested_topic": topic})

@app.get("/api/profile")
@login_required
def get_profile():
    rows = db_select("profiles", {"select": "*", "id": f"eq.{g.user['id']}"})
    if rows:
        return jsonify(rows[0])

    meta = g.user.get("user_metadata") or {}
    username = meta.get("username") or meta.get("full_name") or g.user["email"].split("@")[0]
    created = db_upsert("profiles", {
        "id": g.user["id"],
        "username": username,
        "elo": 1200,
        "solved_count": 0,
        "streak": 0
    }, "id")
    if created:
        return jsonify(created[0])
    return jsonify({"id": g.user["id"], "username": username, "elo": 1200, "solved_count": 0})

@app.patch("/api/profile/username")
@login_required
def update_username():
    data = request.json or {}
    username = data.get("username", "").strip()
    if not username:
        return jsonify({"error": "Username cannot be empty"}), 400
    updated = db_update("profiles", {"username": username}, {"id": f"eq.{g.user['id']}"})
    return jsonify(updated[0] if updated else {"username": username})

@app.get("/api/profile/topic-elos")
@login_required
def get_topic_elos():
    rows = db_select("topic_ratings", {"select": "topic,elo,updated_at", "user_id": f"eq.{g.user['id']}"})
    return jsonify(rows if rows else [])

@app.get("/api/rank")
@login_required
def get_rank():
    all_profiles = db_select("profiles", {"select": "id", "order": "elo.desc"})
    for i, p in enumerate(all_profiles):
        if p["id"] == g.user["id"]:
            return jsonify({"rank": i + 1, "total": len(all_profiles)})
    return jsonify({"rank": None, "total": len(all_profiles)})

@app.get("/api/me/submissions")
@login_required
def get_submissions():
    subs = db_select("submissions", {
        "select": "problem_id,correct,time_taken,submitted_at,submitted_answer,topic,topic_elo_after",
        "user_id": f"eq.{g.user['id']}",
        "order": "submitted_at.desc",
        "limit": "100"
    })
    return jsonify(subs)

@app.post("/api/submit")
@login_required
def submit_answer():
    data = request.json or {}
    problem_id = str(data.get("problem_id", ""))
    user_answer = (data.get("answer") or "").strip()
    time_taken = int(data.get("time_taken") or 0)
    solution_viewed = bool(data.get("solution_viewed"))
    timed_out = bool(data.get("timed_out"))

    if timed_out:
        user_answer = "__TIMED_OUT__"
    elif not user_answer:
        return jsonify({"error": "Enter an answer first."}), 400
    elif re.search(r"[<>{}|\\]", user_answer):
        return jsonify({"error": "Answer contains invalid characters."}), 400

    problems = db_select("problems", {"select": "*", "id": f"eq.{problem_id}"})
    if not problems:
        return jsonify({"error": "Problem not found."}), 404
    problem = problems[0]
    topic = problem.get("topic", "Algebra")

    existing = db_select("submissions", {
        "select": "id",
        "user_id": f"eq.{g.user['id']}",
        "problem_id": f"eq.{problem_id}",
        "correct": "eq.true"
    })
    already_solved = len(existing) > 0

    correct = check_answer(user_answer, problem.get("answer", ""))

    profiles = db_select("profiles", {"select": "*", "id": f"eq.{g.user['id']}"})
    profile = profiles[0] if profiles else {"elo": 1200, "solved_count": 0}

    topic_elo = get_topic_elo(g.user["id"], topic)
    topic_delta, new_topic_elo = calc_elo(topic_elo, problem.get("difficulty"), correct, time_taken)
    global_delta, new_global_elo = calc_elo(profile.get("elo", 1200), problem.get("difficulty"), correct, time_taken)

    if correct and not already_solved:
        changes = {
            "solved_count": (profile.get("solved_count") or 0) + 1,
            "last_active": datetime.date.today().isoformat()
        }
        if not solution_viewed:
            changes["elo"] = new_global_elo
            save_topic_elo(g.user["id"], topic, new_topic_elo)
        else:
            new_topic_elo = topic_elo

        db_update("profiles", changes, {"id": f"eq.{g.user['id']}"})
        db_upsert("submissions", {
            "user_id": g.user["id"],
            "problem_id": problem_id,
            "correct": True,
            "time_taken": time_taken,
            "submitted_answer": user_answer if not timed_out else None,
            "topic": topic,
            "topic_elo_after": new_topic_elo
        }, "user_id,problem_id")
        db_update("problems", {
            "attempts": (problem.get("attempts") or 0) + 1,
            "correct_count": (problem.get("correct_count") or 0) + 1
        }, {"id": f"eq.{problem_id}"})

    elif not correct and not already_solved:
        save_topic_elo(g.user["id"], topic, new_topic_elo)
        try:
            db_insert("submissions", {
                "user_id": g.user["id"],
                "problem_id": problem_id,
                "correct": False,
                "time_taken": time_taken,
                "submitted_answer": user_answer if not timed_out else None,
                "topic": topic,
                "topic_elo_after": new_topic_elo
            })
        except:
            pass
        db_update("problems", {"attempts": (problem.get("attempts") or 0) + 1}, {"id": f"eq.{problem_id}"})

    if correct:
        elo_change = 0 if (solution_viewed or already_solved) else topic_delta
        return jsonify({
            "correct": True,
            "already_solved": already_solved,
            "elo_delta": elo_change,
            "elo_blocked": solution_viewed,
            "new_elo": profile.get("elo", 1200) if (solution_viewed or already_solved) else new_global_elo,
            "topic_elo": topic_elo if (solution_viewed or already_solved) else new_topic_elo,
            "explanation": problem.get("explanation"),
            "answer": problem.get("answer"),
            "time_taken": time_taken
        })

    return jsonify({"correct": False, "elo_delta": topic_delta, "topic_elo": new_topic_elo})

@app.post("/api/problems/<problem_id>/solution")
@login_required
def view_solution(problem_id):
    rows = db_select("problems", {"select": "answer,explanation", "id": f"eq.{problem_id}"})
    if not rows:
        return jsonify({"error": "Problem not found"}), 404
    return jsonify(rows[0])

@app.get("/api/leaderboard")
@login_required
def get_leaderboard():
    rows = db_select("profiles", {
        "select": "id,username,elo,solved_count,streak",
        "order": "elo.desc",
        "limit": "20"
    })
    return jsonify(rows)

@app.post("/api/problems")
@login_required
def create_problem():
    data = request.json or {}
    required_fields = ["title", "body", "topic", "difficulty", "answer", "explanation"]
    for field in required_fields:
        if not (data.get(field) or "").strip():
            return jsonify({"error": f"{field} is required"}), 400

    payload = {
        "title": data["title"].strip(),
        "body": data["body"].strip(),
        "topic": data["topic"],
        "difficulty": data["difficulty"],
        "answer": data["answer"].strip(),
        "explanation": data["explanation"].strip(),
        "hint": (data.get("hint") or "").strip() or None,
        "points": int(data.get("points") or 100),
        "section": data.get("section") or "General",
        "question_type": data.get("question_type") or "open",
        "options": data.get("options"),
        "attempts": 0,
        "correct_count": 0,
        "created_by": g.user["id"]
    }

    res = requests.post(
        f"{DB}/problems",
        headers=get_headers({"Prefer": "return=representation"}),
        json=payload,
        timeout=10
    )
    if res.status_code == 403:
        return jsonify({"error": "You don't have upload permission"}), 403

    result = res.json()
    return jsonify(result[0] if result else payload), 201

@app.get("/api/settings/open_uploads")
@login_required
def get_open_uploads():
    rows = db_select("settings", {"select": "value", "key": "eq.open_uploads"})
    is_open = bool(rows) and rows[0]["value"] == "true"
    return jsonify({"open_uploads": is_open})

@app.post("/api/admin/open_uploads")
@login_required
def set_open_uploads():
    value = bool((request.json or {}).get("value"))
    db_upsert("settings", {"key": "open_uploads", "value": str(value).lower()}, "key")
    return jsonify({"ok": True, "open_uploads": value})

@app.get("/api/admin/users")
@login_required
def get_all_users():
    rows = db_select("profiles", {"select": "id,username,elo,can_upload,is_admin", "order": "elo.desc"})
    return jsonify(rows)

@app.post("/api/admin/users/<user_id>/permission")
@login_required
def update_permission(user_id):
    data = request.json or {}
    field = data.get("field")
    value = bool(data.get("value"))
    if field not in ("can_upload", "is_admin"):
        return jsonify({"error": "Invalid field"}), 400
    db_update("profiles", {field: value}, {"id": f"eq.{user_id}"})
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
