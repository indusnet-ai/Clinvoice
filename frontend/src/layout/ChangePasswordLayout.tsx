import React from "react";
import { Outlet } from "react-router";

const ChangePasswordLayout = () => {
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <main className="bg-white grid">
        <div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ChangePasswordLayout;
