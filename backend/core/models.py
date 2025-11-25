from django.db import models

class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_hours = models.FloatField()
    
    # Calculated fields
    distance_miles = models.FloatField()
    duration_hours = models.FloatField()
    fuel_stops = models.IntegerField()
    
    daily_logs = models.JSONField(null=True, blank=True)  
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.current_location} → {self.dropoff_location} ({self.distance_miles} miles)"
