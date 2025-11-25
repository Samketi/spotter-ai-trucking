import { useState } from "react";
import TripForm from "../components/TripForm";

import { useNavigate } from "react-router-dom";
import type { TripResponse } from "../types/trip";

export default function Home() {
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const navigate = useNavigate();

  const handleTripCreated = (newTrip: TripResponse) => {
    setTrip(newTrip);
    navigate(`/trip/${newTrip.trip_id}`);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Trucking Trip Planner
      </h1>
      <TripForm />
    </div>
  );
}
