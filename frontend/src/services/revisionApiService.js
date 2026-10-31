import { request } from "./api";

export const getRevisionDashboard = async () => {
  return await request("/revision");
};

export const startRevisionSession = async (conceptId) => {
  return await request(`/revision/${conceptId}`);
};

export const completeRevision = async (conceptId, performanceData) => {
  return await request(`/revision/${conceptId}/complete`, {
    method: "POST",
    body: JSON.stringify(performanceData),
  });
};
