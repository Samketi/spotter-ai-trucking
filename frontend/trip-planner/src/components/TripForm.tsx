import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";
import type { TripResponse } from "../types/trip";
import { apiService } from "../services/api";

interface SearchResult {
  x: number;
  y: number;
  label: string;
}

export default function TripForm() {
  const [form, setForm] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_hours: 0,
    start_latlon: [0, 0] as [number, number],
    end_latlon: [0, 0] as [number, number],
  });

  const [suggestions, setSuggestions] = useState<{
    current_location: SearchResult[];
    pickup_location: SearchResult[];
    dropoff_location: SearchResult[];
  }>({
    current_location: [],
    pickup_location: [],
    dropoff_location: [],
  });

  const [showSuggestions, setShowSuggestions] = useState({
    current_location: false,
    pickup_location: false,
    dropoff_location: false,
  });

  const [markers, setMarkers] = useState<
    { pos: [number, number]; label: string; name: string }[]
  >([]);
  const [tripResponse, setTripResponse] = useState<TripResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = new OpenStreetMapProvider();

  const handleInputChange = async (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (value.length < 3) {
      setSuggestions((prev) => ({ ...prev, [field]: [] }));
      return;
    }

    const results = await provider.search({ query: value });
    setSuggestions((prev) => ({ ...prev, [field]: results.slice(0, 5) }));
    setShowSuggestions((prev) => ({ ...prev, [field]: true }));
  };

  const handleSelectSuggestion = (field: string, result: SearchResult) => {
    const { x: lng, y: lat, label } = result;
    const latlon: [number, number] = [lat, lng];

    let name = "";
    if (field === "current_location") {
      name = "Current Location";
      setForm((prev) => ({
        ...prev,
        current_location: label,
        start_latlon: latlon,
      }));
    } else if (field === "pickup_location") {
      name = "Pickup Location";
      setForm((prev) => ({ ...prev, pickup_location: label }));
    } else {
      name = "Dropoff Location";
      setForm((prev) => ({
        ...prev,
        dropoff_location: label,
        end_latlon: latlon,
      }));
    }

    setMarkers((prev) => {
      const filtered = prev.filter((m) => m.label !== field);
      return [...filtered, { pos: latlon, label: field, name }];
    });

    setSuggestions((prev) => ({ ...prev, [field]: [] }));
    setShowSuggestions((prev) => ({ ...prev, [field]: false }));
  };

 const handleSubmit = async () => {
   if (
     !form.current_location ||
     !form.pickup_location ||
     !form.dropoff_location
   ) {
     setError("Please fill all locations");
     return;
   }

   setLoading(true);
   setError(null);

   try {
     console.log("Form data", form)
     const data = await apiService.post<TripResponse>("trip/", form);
     console.log("Response,",data)
     setTripResponse(data);
   } catch (err) {
     setError(err instanceof Error ? err.message : "An error occurred");
   } finally {
     setLoading(false);
   }
 };

  const renderAutocompleteInput = (
    field: "current_location" | "pickup_location" | "dropoff_location",
    placeholder: string
  ) => (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={form[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        onFocus={() =>
          setShowSuggestions((prev) => ({ ...prev, [field]: true }))
        }
        className="w-full p-2 border rounded-md"
      />
      {showSuggestions[field] && suggestions[field].length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions[field].map((result, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectSuggestion(field, result)}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
            >
              <div className="text-sm font-medium">{result.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const routePositions = markers
    .sort((a, b) => {
      const order = {
        current_location: 0,
        pickup_location: 1,
        dropoff_location: 2,
      };
      return (
        order[a.label as keyof typeof order] -
        order[b.label as keyof typeof order]
      );
    })
    .map((m) => m.pos);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold text-center">Trip Planner</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          {renderAutocompleteInput("current_location", "Current Location")}
          {renderAutocompleteInput("pickup_location", "Pickup Location")}
          {renderAutocompleteInput("dropoff_location", "Dropoff Location")}

          <input
            type="number"
            placeholder="Current cycle hours"
            value={form.current_cycle_hours}
            onChange={(e) =>
              setForm({ ...form, current_cycle_hours: Number(e.target.value) })
            }
            className="w-full p-2 border rounded-md"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Calculating..." : "Calculate Trip"}
          </button>

          {tripResponse && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-md space-y-2">
              <h3 className="font-bold text-lg">Trip Summary</h3>
              <p>
                <strong>Trip ID:</strong> {tripResponse.trip_id}
              </p>
              <p>
                <strong>Distance:</strong>{" "}
                {tripResponse.distance_miles.toFixed(2)} miles
              </p>
              <p>
                <strong>Duration:</strong>{" "}
                {tripResponse.duration_hours.toFixed(2)} hours
              </p>
              <p>
                <strong>Fuel Stops:</strong> {tripResponse.fuel_stops}
              </p>
            </div>
          )}
        </div>

        <div>
          <MapContainer
            center={markers[0]?.pos || [37.7749, -122.4194]}
            zoom={5}
            className="h-96 w-full rounded-md"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {markers.map((marker, idx) => (
              <Marker key={idx} position={marker.pos}>
                <Popup>{marker.name}</Popup>
              </Marker>
            ))}

            {routePositions.length > 1 && (
              <Polyline positions={routePositions} color="blue" weight={3} />
            )}
          </MapContainer>
        </div>
      </div>

      {tripResponse && (
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-bold">Daily Logs</h3>
          {tripResponse.daily_logs.map((log) => (
            <div key={log.day} className="border rounded-md p-4 bg-gray-50">
              <h4 className="font-bold text-lg mb-3">Day {log.day}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 text-left">Event Type</th>
                      <th className="p-2 text-right">Hours</th>
                      <th className="p-2 text-right">Miles</th>
                      <th className="p-2 text-right">Total Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.events.map((event, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 capitalize">
                          {event.type.replace("_", " ")}
                        </td>
                        <td className="p-2 text-right">
                          {event.hours.toFixed(2)}
                        </td>
                        <td className="p-2 text-right">
                          {event.miles.toFixed(2)}
                        </td>
                        <td className="p-2 text-right">
                          {event.distance_covered.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
