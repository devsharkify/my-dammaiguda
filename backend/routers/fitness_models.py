"""Fitness Models - All Pydantic models for Kaizer Fit"""
from pydantic import BaseModel
from typing import Optional, List

class ActivityLog(BaseModel):
    activity_type: str
    duration_minutes: int
    distance_km: Optional[float] = None
    steps: Optional[int] = None
    calories_burned: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    heart_rate_max: Optional[int] = None
    notes: Optional[str] = None
    source: str = "manual"

class WearableSync(BaseModel):
    device_type: str
    activities: List[dict]
    sync_date: str

class CreateChallenge(BaseModel):
    title: str
    description: str
    challenge_type: str
    target_value: int
    start_date: str
    end_date: str

class LiveActivityStart(BaseModel):
    activity_type: str
    target_duration: Optional[int] = None
    target_distance: Optional[float] = None
    target_calories: Optional[int] = None

class LiveActivityUpdate(BaseModel):
    session_id: str
    current_duration_seconds: int
    current_distance_meters: Optional[float] = None
    current_calories: Optional[int] = None
    current_steps: Optional[int] = None
    heart_rate: Optional[int] = None
    gps_points: Optional[List[dict]] = None
    speed_kmh: Optional[float] = None
    pace_min_per_km: Optional[float] = None

class LiveActivityEnd(BaseModel):
    session_id: str
    total_duration_seconds: int
    total_distance_meters: Optional[float] = None
    total_calories: Optional[int] = None
    total_steps: Optional[int] = None
    avg_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None

class WeightEntry(BaseModel):
    weight_kg: float
    notes: Optional[str] = None

class GoalWeight(BaseModel):
    target_weight_kg: float

class FitnessProfile(BaseModel):
    height_cm: float
    weight_kg: float
    gender: str
    age: int
    fitness_goal: Optional[str] = None

class ManualActivityRecord(BaseModel):
    activity_type: str
    duration_minutes: int
    date: str
    distance_km: Optional[float] = None
    calories_burned: Optional[int] = None
    steps: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    notes: Optional[str] = None

class SleepEntry(BaseModel):
    date: str
    sleep_start: str
    sleep_end: str
    quality: Optional[str] = "good"
    deep_sleep_minutes: Optional[int] = None
    light_sleep_minutes: Optional[int] = None
    rem_sleep_minutes: Optional[int] = None
    awakenings: Optional[int] = 0
    notes: Optional[str] = None

class PhoneSensorData(BaseModel):
    steps: int
    distance_meters: Optional[float] = None
    calories: Optional[int] = None
    active_minutes: Optional[int] = None
    floors_climbed: Optional[int] = None
    timestamp: str
    source: str = "phone_pedometer"

class SmartWatchData(BaseModel):
    device_brand: str
    device_model: Optional[str] = None
    steps: int
    heart_rate_current: Optional[int] = None
    heart_rate_resting: Optional[int] = None
    heart_rate_min: Optional[int] = None
    heart_rate_max: Optional[int] = None
    calories_total: Optional[int] = None
    calories_active: Optional[int] = None
    distance_meters: Optional[float] = None
    active_minutes: Optional[int] = None
    sleep_data: Optional[dict] = None
    blood_oxygen: Optional[float] = None
    stress_level: Optional[int] = None
    sync_timestamp: str

class StepSyncData(BaseModel):
    steps: int
    source: str = "phone_pedometer"
    date: str

class StepGoalData(BaseModel):
    goal: int

class DeviceConnection(BaseModel):
    device_type: str
    device_name: Optional[str] = None
    device_id: Optional[str] = None
