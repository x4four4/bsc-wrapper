import { motion } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";

interface TransferStatusProps {
  status: string;
  message?: string;
}

function TransferStatus({ status, message }: TransferStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <FiCheckCircle className="text-4xl" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center py-8"
    >
      {getStatusIcon() && (
        <div className={`${getStatusColor()} mb-4 flex justify-center`}>
          {getStatusIcon()}
        </div>
      )}
      {message && (
        <p className={`text-lg font-medium ${getStatusColor()}`}>{message}</p>
      )}
    </motion.div>
  );
}

export default TransferStatus;
