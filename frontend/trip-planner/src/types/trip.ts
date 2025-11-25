export interface TripResponse {
  trip_id: string;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  distance_miles: number;
  duration_hours: number;
  fuel_stops: number;
  daily_logs: DailyLog[];
}

interface DailyLog {
  day: number;
  events: LogEvent[];
}

interface LogEvent {
  type: string;
  hours: number;
  miles: number;
  distance_covered: number;
}
