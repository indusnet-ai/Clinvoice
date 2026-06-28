export const StatusRenamer = (status: string) => {
  const normalizedStatus = status.toLowerCase().trim();

  switch (normalizedStatus) {
    case "pending":
      return "appointment.status.startNow";
    case "inprocess":
      return "appointment.status.inProgress";
    case "completed":
      return "appointment.status.completed";
    default:
      return status;
  }
};
