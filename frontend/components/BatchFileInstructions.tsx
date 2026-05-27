export default function BatchFileInstructions() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600">
      <p className="font-semibold text-slate-800">File format</p>
      <p className="mt-1.5">
        Supported files: JSON and CSV. Batch mode sends the whole file to the
        server, and the backend assigns operations to active devices.
      </p>
      <p className="mt-1.5">
        JSON must contain an array. Each operation uses the same fields as a
        single operation: <span className="font-semibold">operation</span>,{" "}
        <span className="font-semibold">a</span>,{" "}
        <span className="font-semibold">b</span>.
      </p>
      <pre className="mt-2 overflow-auto rounded-md bg-white p-2 text-[10px] text-slate-700">
{`[
  { "operation": "add", "a": 2, "b": 3 },
  { "operation": "multiply", "a": 4, "b": 5 }
]`}
      </pre>
      <p className="mt-1.5">
        CSV requires headers:{" "}
        <span className="font-semibold">operation,a,b</span>. No backend file
        size limit is defined in the current code.
      </p>
    </div>
  );
}
