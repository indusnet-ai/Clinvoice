import { CloseIcon } from "@/assets/icons";
import { Button } from "@/atoms";
import { CustomDialog } from "@/app/component";
import React from "react";
import { useDeletePatientMutation } from "../services/PatientApi";
import { showToast } from "@/utils";

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  selectedID: number;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ open, onClose, selectedID }) => {
  const [deletePatient] = useDeletePatientMutation();
  const handleDelete = () => {
    if (selectedID) {
      const res = deletePatient({ id: selectedID }).unwrap();
      showToast("Patient deleted successfully", "success");
      onClose();
    }
  };
  return (
    <CustomDialog open={open} onClose={onClose} maxWidth="xs">
      <div>
        <div className="flex items-end  justify-end">
          <CloseIcon color="#98999E" className="cursor-pointer" onClick={onClose} />
        </div>
        <div>
          <text>Are you sure, Do you want to Delete ?</text>
          <div className="flex items-center w-full gap-7 mt-5">
            <Button variant="outlined" label="Cancel" onClick={onClose} />
            <Button label="Delete" onClick={handleDelete} />
          </div>
        </div>
      </div>
    </CustomDialog>
  );
};

export default DeleteDialog;
