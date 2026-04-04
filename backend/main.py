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

@app.get("/")
def root():
    return {"message": "Backend działa"}

@app.post("/tasks")
def create_task(task: Task):
    print(f"Received task: {task.operation} with a={task.a} and b={task.b}")
    return {
        "task_id": 1,
        "status": "queued",
        "received": task.model_dump()
    }