type InfoAlertProps = {
  message: string;
};

export default function InfoAlert({ message }: InfoAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-2 text-xs text-blue-700">
      {message}
    </div>
  );
}
