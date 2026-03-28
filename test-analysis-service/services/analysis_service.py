def analyze_performance(questions, answers):
    """Rule-based performance analysis."""

    topic_stats = {}

    for answer in answers:
        q = questions[answer["question_index"]]
        topic = q["topic"]

        if topic not in topic_stats:
            topic_stats[topic] = {
                "total": 0,
                "correct": 0,
                "total_time": 0,
                "total_expected_time": 0,
                "questions": [],
            }

        stats = topic_stats[topic]
        stats["total"] += 1
        if answer["correct"]:
            stats["correct"] += 1
        stats["total_time"] += answer["time_taken"]
        stats["total_expected_time"] += q["expected_time_seconds"]
        stats["questions"].append(
            {
                "question": q["question"],
                "subtopic": q["subtopic"],
                "correct": answer["correct"],
                "time_taken": answer["time_taken"],
                "expected_time": q["expected_time_seconds"],
                "selected": answer["selected_answer"],
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"],
            }
        )

    topic_performance = {}
    weaknesses = []

    for topic, stats in topic_stats.items():
        accuracy = (stats["correct"] / stats["total"]) * 100 if stats["total"] > 0 else 0
        avg_time = stats["total_time"] / stats["total"] if stats["total"] > 0 else 0
        avg_expected = stats["total_expected_time"] / stats["total"] if stats["total"] > 0 else 0
        time_ratio = avg_time / avg_expected if avg_expected > 0 else 1

        topic_performance[topic] = {
            "accuracy": round(accuracy, 1),
            "avg_time": round(avg_time, 1),
            "avg_expected_time": round(avg_expected, 1),
            "time_ratio": round(time_ratio, 2),
            "total_questions": stats["total"],
            "correct_count": stats["correct"],
            "questions": stats["questions"],
        }

        is_weak = accuracy < 60 or time_ratio > 1.5
        if is_weak:
            reasons = []
            if accuracy < 60:
                reasons.append(f"Low accuracy ({accuracy:.0f}%)")
            if time_ratio > 1.5:
                reasons.append(f"Takes {time_ratio:.1f}x expected time")
            weaknesses.append(
                {
                    "topic": topic,
                    "accuracy": accuracy,
                    "time_ratio": time_ratio,
                    "reasons": reasons,
                    "severity": "high" if accuracy < 40 else "medium",
                }
            )

    total_correct = sum(1 for a in answers if a["correct"])
    total_questions = len(answers)
    total_time = sum(a["time_taken"] for a in answers)
    total_expected = sum(
        questions[a["question_index"]]["expected_time_seconds"] for a in answers
    )

    return {
        "overall": {
            "score": round((total_correct / total_questions) * 100, 1) if total_questions > 0 else 0,
            "correct": total_correct,
            "total": total_questions,
            "total_time": total_time,
            "total_expected_time": total_expected,
        },
        "topic_performance": topic_performance,
        "weaknesses": weaknesses,
    }
