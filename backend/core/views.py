from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Trip
import uuid
from .utils import combine_consecutive_drives, generate_daily_logs_with_distance_and_fuel, get_route_info, calculate_fuel_stops


class TripView(APIView):
    def post(self, request):
        # 1. Extract input fields
        current_location = request.data.get("current_location")
        pickup_location = request.data.get("pickup_location")
        dropoff_location = request.data.get("dropoff_location")
        current_cycle_hours = request.data.get("current_cycle_hours")
        start_latlon = request.data.get("start_latlon")     # [lat, lon]
        end_latlon = request.data.get("end_latlon")         # [lat, lon]

        # 2. Validate required fields
        if not all([current_location, pickup_location, dropoff_location,
                    current_cycle_hours, start_latlon, end_latlon]):
            return Response(
                {"error": "All fields (current_location, pickup_location, dropoff_location, current_cycle_hours, start_latlon, end_latlon) are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Route calculation
        distance, duration = get_route_info(start_latlon, end_latlon)
        if distance is None:
            return Response(
                {"error": "Route calculation failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 4. Fuel stops
        fuel_stops = calculate_fuel_stops(distance)
        print("Hit 1")
        current_cycle_hours = request.data.get("current_cycle_hours")
        daily_logs = generate_daily_logs_with_distance_and_fuel(distance_miles=distance,total_hours=duration, current_cycle_hours=current_cycle_hours)
        print("Hit 2")
        combined_logs = combine_consecutive_drives(daily_logs)
        print("Hit 3")
       

        # 5. Save Trip
        # trip = Trip.objects.create(
        #     current_location=current_location,
        #     pickup_location=pickup_location,
        #     dropoff_location=dropoff_location,
        #     current_cycle_hours=current_cycle_hours,
        #     distance_miles=distance,
        #     duration_hours=duration,
        #     fuel_stops=fuel_stops,
        # )

        # 6. Response
        return Response({
            "trip_id": str(uuid.uuid4()),
            "current_location": current_location,
            "pickup_location": pickup_location,
            "dropoff_location": dropoff_location,
            "distance_miles": distance,
            "duration_hours": duration,
            "fuel_stops": fuel_stops,
            "daily_logs":combined_logs,
        }, status=status.HTTP_200_OK)
