"""Unit tests for TryLo Multimodal Video & Voice AI Service."""

import uuid
from app.models.feedback import FeedbackSubmission
from app.services.ai_video_voice import analyze_recording_voice_and_frustration


def make_submission(title: str, desc: str, severity: str = "critical") -> FeedbackSubmission:
    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.campaign_id = uuid.uuid4()
    sub.tester_id = uuid.uuid4()
    sub.title = title
    sub.description = desc
    sub.severity = severity
    sub.feedback_type = "bug"
    sub.video_url = "/api/feedback/videos/test.webm"
    sub.video_duration_seconds = 80
    return sub


def test_analyze_recording_voice_and_frustration_payment():
    sub = make_submission("Stripe checkout freezes on card submit", "Modal hangs forever on pay button click")
    result = analyze_recording_voice_and_frustration(sub)

    assert result["feedback_id"] == sub.id
    assert result["total_segments"] >= 4
    assert result["average_frustration_score"] >= 5.0
    assert result["peak_frustration_timestamp"] != "0:00"
    assert len(result["segments"]) >= 4

    # Check speech-to-text transcript and frustration intensity
    peak_segment = max(result["segments"], key=lambda s: s["frustration_intensity"])
    assert peak_segment["frustration_intensity"] >= 8
    assert "spinner" in peak_segment["spoken_transcript"].lower() or "modal" in peak_segment["spoken_transcript"].lower()

    # Check synchronized telemetry events
    assert "telemetry_events" in result
    assert len(result["telemetry_events"]) >= 4
    assert any(e["event_type"] == "console_error" for e in result["telemetry_events"])
    assert any(e["event_type"] == "network_request" for e in result["telemetry_events"])



def test_analyze_recording_voice_and_frustration_crash():
    sub = make_submission("White screen crash on account profile", "Uncaught TypeError", severity="critical")
    result = analyze_recording_voice_and_frustration(sub)

    assert "blank" in result["segments"][2]["spoken_transcript"].lower() or "crash" in result["segments"][2]["spoken_transcript"].lower()
    assert result["segments"][2]["frustration_intensity"] >= 7

