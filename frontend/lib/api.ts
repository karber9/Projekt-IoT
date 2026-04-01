export type TaskRequest = {
    operation: string;
    a: number;
    b: number;
  };
  
  export type TaskResponse = {
    task_id: number;
    status: string;
    received?: {
      operation: string;
      a: number;
      b: number;
    };
    error?: string;
  };
  
  const BASE_URL = "http://localhost:8000";
  
  export async function createTask(data: TaskRequest): Promise<TaskResponse> {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  
    const result = await response.json();
  
    if (!response.ok) {
      throw new Error(result?.detail || "Error while sending task request");
    }
  
    return result;
  }