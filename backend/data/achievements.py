"""Achievement definitions for the HandSpeak reward system."""

ACHIEVEMENTS = [
    # ── First-time actions ──
    {"id": "first_quiz",     "name": "Quiz Rookie",      "desc": "Complete your first Sign Quiz",            "icon": "🧠", "category": "milestone", "xp_bonus": 10},
    {"id": "first_daily",    "name": "Daily Starter",    "desc": "Complete your first Daily Challenge",      "icon": "📅", "category": "milestone", "xp_bonus": 10},
    {"id": "first_match",    "name": "First Pair",       "desc": "Complete your first Sign Match",           "icon": "🃏", "category": "milestone", "xp_bonus": 10},
    {"id": "first_converse", "name": "Conversationalist","desc": "Complete your first Converse session",     "icon": "💬", "category": "milestone", "xp_bonus": 10},

    # ── Quiz mastery ──
    {"id": "quiz_perfect",   "name": "Quiz Master",      "desc": "Score 100% on a Sign Quiz (10/10)",        "icon": "🎯", "category": "quiz",      "xp_bonus": 20},
    {"id": "quiz_10",        "name": "Quiz Veteran",     "desc": "Complete 10 Sign Quizzes",                 "icon": "📚", "category": "quiz",      "xp_bonus": 30},

    # ── Match mastery ──
    {"id": "match_perfect",  "name": "Photographic",     "desc": "Complete Sign Match with zero misses",     "icon": "🏆", "category": "match",     "xp_bonus": 20},
    {"id": "match_10",       "name": "Card Shark",       "desc": "Complete 10 Sign Match games",             "icon": "♠",  "category": "match",     "xp_bonus": 30},

    # ── Streaks ──
    {"id": "streak_3",       "name": "On a Roll",        "desc": "Maintain a 3-day Daily Challenge streak",  "icon": "🔥", "category": "streak",    "xp_bonus": 15},
    {"id": "streak_7",       "name": "Week Warrior",     "desc": "Maintain a 7-day Daily Challenge streak",  "icon": "⚡", "category": "streak",    "xp_bonus": 25},
    {"id": "streak_30",      "name": "Dedicated",        "desc": "Maintain a 30-day Daily Challenge streak", "icon": "💎", "category": "streak",    "xp_bonus": 100},

    # ── XP milestones (xp_bonus=0 to avoid infinite loops) ──
    {"id": "xp_50",          "name": "Getting Started",  "desc": "Earn a total of 50 XP",                   "icon": "⭐", "category": "xp",        "xp_bonus": 0},
    {"id": "xp_200",         "name": "Rising Diver",     "desc": "Earn a total of 200 XP",                  "icon": "🌟", "category": "xp",        "xp_bonus": 0},
    {"id": "xp_500",         "name": "Signing Pro",      "desc": "Earn a total of 500 XP",                  "icon": "💫", "category": "xp",        "xp_bonus": 0},

    # ── Level milestones ──
    {"id": "level_5",        "name": "Depth Diver",      "desc": "Reach Level 5",                           "icon": "🚀", "category": "level",     "xp_bonus": 0},
    {"id": "level_10",       "name": "Ocean Explorer",   "desc": "Reach Level 10",                          "icon": "🌊", "category": "level",     "xp_bonus": 0},
]

ACHIEVEMENT_MAP = {a["id"]: a for a in ACHIEVEMENTS}


def get_all():
    return ACHIEVEMENTS


def get_by_id(achievement_id: str):
    return ACHIEVEMENT_MAP.get(achievement_id)
