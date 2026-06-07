export type OperationMode = "single" | "batch";

type OperationModeSwitchProps = {
  mode: OperationMode;
  onChange: (mode: OperationMode) => void;
};

const modes: Array<{ label: string; value: OperationMode }> = [
  { label: "Single operation", value: "single" },
  { label: "File batch", value: "batch" },
];

export default function OperationModeSwitch({
  mode,
  onChange,
}: OperationModeSwitchProps) {
  return (
    <div className="mb-3 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
      {modes.map((item) => {
        const isActive = mode === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              isActive
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            aria-pressed={isActive}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
