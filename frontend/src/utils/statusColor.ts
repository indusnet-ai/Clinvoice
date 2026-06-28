export const normalizeStatus = (status: string) => status.trim().toLowerCase();

export const statusColor: Record<string, { textColor: string; bgColor: string }> = {
  "appointment.status.startNow": {
    textColor: "#FDFDFD",
    bgColor: "#6070FF",
  },
  "appointment.status.inProgress": {
    textColor: "#6070FF",
    bgColor: "#6070FF40",
  },
  resume: {
    textColor: "#F59E0B",
    bgColor: "#FFF3CA",
  },
  "appointment.status.completed": {
    textColor: "#166534",
    bgColor: "#DCFCE7",
  },
  pending: {
    textColor: "#F59E0B",
    bgColor: "#FFF3CA",
  },
  inprocess: {
    textColor: "#F59E0B",
    bgColor: "#FFF3CA",
  },
  default: {
    textColor: "#374151",
    bgColor: "#E5E7EB",
  },
};
