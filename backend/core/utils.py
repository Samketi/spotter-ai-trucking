import requests

API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImM3ZjFlMTIwMGJlNzRkOWM5ODA3YTFjNjZhMTc5OTQ5IiwiaCI6Im11cm11cjY0In0="

def get_route_info(start_latlon, end_latlon):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "coordinates": [
            [start_latlon[1], start_latlon[0]], 
            [end_latlon[1], end_latlon[0]]
        ]
    }

    print("Hit here")

    response = requests.post(url=url, json=body, headers=headers)
    if response.status_code == 200:
        data = response.json()
        distance_miles = data["routes"][0]["summary"]["distance"] / 1609.34  
        duration_hours = data["routes"][0]["summary"]["duration"] / 3600
        print(distance_miles, duration_hours)  
        return distance_miles, duration_hours
    else:
        print("Route API error:", response.text)
        return None, None
    


def calculate_fuel_stops(distance_miles, interval=1000):
    stops = distance_miles// interval
    if distance_miles % interval != 0:
        stops+=1
    return int(stops)

def generate_fuel_stop_positions(distance_miles):
    stops = []
    miles = 1000

    while miles < distance_miles:
        stops.append(miles)
        miles += 1000

    return stops

def combine_consecutive_drives(logs):
    """Combine consecutive drive events into single entries"""
    for day_log in logs:
        events = day_log["events"]
        combined_events = []
        i = 0
        
        while i < len(events):
            event = events[i]
            
            # If it's a drive, start combining
            if event["type"] == "drive":
                total_hours = event["hours"]
                total_miles = event["miles"]
                distance_covered = event["distance_covered"]
                
                # Look ahead for more consecutive drives
                j = i + 1
                while j < len(events) and events[j]["type"] == "drive":
                    total_hours += events[j]["hours"]
                    total_miles += events[j]["miles"]
                    distance_covered = events[j]["distance_covered"]
                    j += 1
                
                # Add combined drive event
                combined_events.append({
                    "type": "drive",
                    "hours": round(total_hours, 2),
                    "miles": round(total_miles, 2),
                    "distance_covered": round(distance_covered, 2)
                })
                
                i = j
            else:
                combined_events.append(event)
                i += 1
        
        day_log["events"] = combined_events
    
    return logs

def generate_daily_logs_with_distance_and_fuel(distance_miles, total_hours, current_cycle_hours=0):
    MAX_DRIVE_HOURS_PER_DAY = 11
    DRIVE_CHUNK_HOURS = 1
    FUEL_STOP_TIME = 0.5
    REST_HOURS = 10
    FUEL_STOP_INTERVAL = 1000  # miles

    mph = distance_miles / total_hours
    remaining_miles = distance_miles
    remaining_hours = total_hours
    distance_covered = 0
    next_fuel_mile = FUEL_STOP_INTERVAL
    day = 1
    hours_today = current_cycle_hours
    logs = [{"day": day, "events": []}]

    iteration = 0

    print(f"\n=== Starting trip generation ===")
    print(f"Total distance: {distance_miles} miles, Total hours: {total_hours}, Speed: {mph:.2f} mph")

    # Pickup event
    logs[-1]["events"].append({"type": "pickup", "hours": 1, "miles": 0, "distance_covered": 0})
    hours_today += 1
    remaining_hours -= 1
    print(f"Day {day}: Pickup event added")

    while remaining_miles > 0.01:
        iteration += 1
        if iteration % 50 == 0:
            print(f"Iteration {iteration}: Day {day}, Remaining miles: {remaining_miles:.2f}, Distance covered: {distance_covered:.2f}")

        # Start new day if daily limit reached
        if hours_today >= MAX_DRIVE_HOURS_PER_DAY:
            logs[-1]["events"].append({
                "type": "rest",
                "hours": REST_HOURS,
                "miles": 0,
                "distance_covered": round(distance_covered, 2)
            })
            print(f"Day {day}: Rest for {REST_HOURS} hours")
            day += 1
            logs.append({"day": day, "events": []})
            hours_today = 0

        # Determine drive chunk (ensure it's positive)
        drive_hours = min(DRIVE_CHUNK_HOURS, MAX_DRIVE_HOURS_PER_DAY - hours_today, remaining_hours)
        if drive_hours < 0.01:  # prevent zero chunk
            print(f"Warning: drive_hours too small ({drive_hours}). Forcing minimum 0.1")
            drive_hours = 0.1
        drive_miles = drive_hours * mph
        if drive_miles < 0.01:  # prevent zero miles
            drive_miles = 0.01

        # Check fuel stop
        if distance_covered + drive_miles >= next_fuel_mile and remaining_miles > 0.01:
            miles_to_fuel = next_fuel_mile - distance_covered
            hours_to_fuel = miles_to_fuel / mph

            if hours_to_fuel > 0.01:
                logs[-1]["events"].append({
                    "type": "drive",
                    "hours": round(hours_to_fuel, 2),
                    "miles": round(miles_to_fuel, 2),
                    "distance_covered": round(distance_covered + miles_to_fuel, 2)
                })
                hours_today += hours_to_fuel
                remaining_hours -= hours_to_fuel
                remaining_miles -= miles_to_fuel
                distance_covered += miles_to_fuel
                print(f"Day {day}: Drive {miles_to_fuel:.2f} miles to fuel stop")

            logs[-1]["events"].append({
                "type": "fuel_stop",
                "hours": FUEL_STOP_TIME,
                "miles": 0,
                "distance_covered": round(distance_covered, 2)
            })
            hours_today += FUEL_STOP_TIME
            next_fuel_mile += FUEL_STOP_INTERVAL
            print(f"Day {day}: Fuel stop at mile {distance_covered:.2f}")
            continue

        # Normal drive
        logs[-1]["events"].append({
            "type": "drive",
            "hours": round(drive_hours, 2),
            "miles": round(drive_miles, 2),
            "distance_covered": round(distance_covered + drive_miles, 2)
        })
        hours_today += drive_hours
        remaining_hours -= drive_hours
        remaining_miles -= drive_miles
        distance_covered += drive_miles
        print(f"Day {day}: Drive {drive_miles:.2f} miles, Total distance covered: {distance_covered:.2f}")

        remaining_miles = max(0, remaining_miles)

    # Dropoff event
    logs[-1]["events"].append({
        "type": "dropoff",
        "hours": 1,
        "miles": 0,
        "distance_covered": round(distance_covered, 2)
    })
    print(f"Day {day}: Dropoff event added")

    # End-of-trip rest
    logs[-1]["events"].append({
        "type": "rest",
        "hours": REST_HOURS,
        "miles": 0,
        "distance_covered": round(distance_covered, 2)
    })
    print(f"Day {day}: End-of-trip rest added")

    print(f"=== Finished trip generation in {iteration} iterations ===\n")
    return logs
