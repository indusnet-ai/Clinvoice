import { CustomDialog } from "@/app/component";
import { useNavigationGuard } from "@/app/navigation/NavigationGaurdContext";

export const NavigationGuardDialog = () => {
  const { isDialogOpen, dialogConfig, confirmNavigation, cancelNavigation } = useNavigationGuard();

  if (!isDialogOpen) return null;

  return (
    <CustomDialog open onClose={cancelNavigation} maxWidth="sm">
      <h3>{dialogConfig?.title ?? "Leave this page?"}</h3>
      <p>{dialogConfig?.message ?? "Unsaved changes will be lost."}</p>

      <div className="flex justify-end gap-3 mt-4">
        <button onClick={cancelNavigation}>{dialogConfig?.cancelText ?? "Stay"}</button>
        <button onClick={confirmNavigation} className="bg-red-600 text-white">
          {dialogConfig?.confirmText ?? "Leave"}
        </button>
      </div>
    </CustomDialog>
  );
};
