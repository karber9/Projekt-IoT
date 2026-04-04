type ErrorAlertProps = {
    message: string;
  };
  
  export default function ErrorAlert({ message }: ErrorAlertProps) {
    if (!message) {
      return null;
    }
  
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {message}
      </div>
    );
  }