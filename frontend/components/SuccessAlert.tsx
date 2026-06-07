type SuccessAlertProps = {
  message: string;
};

export default function SuccessAlert({ message }: SuccessAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-2 text-xs text-green-700">
      {message}
    </div>
  );
}
