import { CustomDialog } from "@/app/component";

interface OfflineDialogProps {
  open: boolean;
}

const OfflineDialog = ({ open }: OfflineDialogProps) => {
  return (
    <CustomDialog open={open} onClose={() => {}} maxWidth="xs" disableBackdropClose disableEscClose>
      <div className="text-center">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>

        <h2 className="text-lg font-semibold text-gray-800">No Internet Connection</h2>

        <p className="text-sm text-gray-600 mt-2">
          Please check your internet connection.
          <br />
          This app will reconnect automatically.
        </p>

        <div className="mt-4 text-sm font-medium text-blue-600 animate-pulse">Waiting for network...</div>
      </div>
    </CustomDialog>
  );
};

export default OfflineDialog;
