import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiService } from "../services/api";
import type { TripResponse } from "../types/trip";


export default function TripDetails() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState<TripResponse | null>(null);

  useEffect(() => {
    if (tripId) {
      apiService.get<TripResponse>(`/trips/${tripId}/`).then(setTrip);
    }
  }, [tripId]);

  if (!trip) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-md rounded-md mt-6">
      <h2 className="text-xl font-semibold mb-4">Trip #{trip.trip_id}</h2>
      <p>
        <strong>Current Location:</strong> {trip.current_location}
      </p>
      <p>
        <strong>Pickup Location:</strong> {trip.pickup_location}
      </p>
      <p>
        <strong>Dropoff Location:</strong> {trip.dropoff_location}
      </p>
      <p>
        <strong>Distance:</strong> {trip.distance_miles.toFixed(2)} miles
      </p>
      <p>
        <strong>Duration:</strong> {trip.duration_hours.toFixed(2)} hrs
      </p>
      <p>
        <strong>Fuel Stops:</strong> {trip.fuel_stops}
      </p>

      <h3 className="text-lg font-semibold mt-4">Daily Logs</h3>
      {trip.daily_logs.map((dayLog) => (
        <div key={dayLog.day} className="mt-2 p-2 border rounded bg-gray-50">
          <p className="font-medium mb-1">Day {dayLog.day}</p>
          <ul className="list-disc list-inside">
            {dayLog.events.map((event, idx) => (
              <li key={idx}>
                {event.type.toUpperCase()} - {event.hours} hr
                {event.miles !== undefined &&
                  ` - ${event.miles.toFixed(2)} miles`}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
