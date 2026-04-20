from time import sleep
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    operation: str
    a: int
    b: int
    device_id: str

@app.get("/")
def root():
    return {"message": "Backend działa"}

@app.post("/tasks/operations")
def create_task(task: Task):
    print(f"Received task: {task.operation} with a={task.a} and b={task.b} and device_id={task.device_id}")
    sleep(2)  # Simulate some processing time
    return {
        "task_id": 1,
        "status": "queued",
        "received": task.model_dump()
    }