import { TaskResponse } from "@/lib/api";

type OperationResponseCardProps = {
  response: TaskResponse | null;
};

export default function OperationResponseCard({
  response,
}: OperationResponseCardProps) {
  if (!response) {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">
        Server Response
      </h2>

      <div className="space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold">task_id:</span> {response.task_id}
        </p>
        <p>
          <span className="font-semibold">status:</span> {response.status}
        </p>

        {response.received && (
          <div>
            <p className="mb-1 font-semibold">received:</p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-slate-100">
              {JSON.stringify(response.received, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}