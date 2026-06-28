import React from "react";
import { CustomDialog } from "./CustomDialog";

interface CommonLoaderProps {
  open: boolean;
  onClose: () => void;
}

const CommonLoader:React.FC<CommonLoaderProps> = ({open,onClose}) => {
  return (
    <div>
      <CustomDialog open={open} onClose={onClose} maxWidth="xl" >
        <div className="">

        </div>
      </CustomDialog>
    </div>
  );
};

export default CommonLoader;
