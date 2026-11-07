from fastapi import FastAPI

app = FastAPI(title="Jamaica Hotel - Analytics Engine")

@app.get("/")
def root():
    return {"service": "Python Analytics Engine", "status": "Ready"}

@app.get("/predict")
def predict_wait_time(orders: int):
    # Basic prediction logic: 5 mins base time + 3 mins per order in queue
    estimated_minutes = 5 + (orders * 3)
    return {
        "orders_in_queue": orders,
        "estimated_wait_time_minutes": estimated_minutes,
        "recommendation": "High volume - assign extra kitchen staff" if orders > 10 else "Normal pace"
    }