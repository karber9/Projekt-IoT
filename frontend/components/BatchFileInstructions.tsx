export default function BatchFileInstructions() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600">
      <p className="font-semibold text-slate-800">File format</p>
      <p className="mt-1.5">
        Supported files: JSON, CSV, and TXT. Batch mode sends expressions to the
        server, and the backend assigns them to active devices.
      </p>
      <p className="mt-1.5">
        JSON can contain an array of expression strings. Each expression must be
        one binary operation, like <span className="font-semibold">21/7</span>.
      </p>
      <pre className="mt-2 overflow-auto rounded-md bg-white p-2 text-[10px] text-slate-700">
{`[
  "21/7",
  "2+4",
  "6*9"
]`}
      </pre>
      <p className="mt-1.5">
        TXT and CSV can also contain one expression per line. CSV may use an{" "}
        <span className="font-semibold">expression</span> header.
      </p>
    </div>
  );
}
