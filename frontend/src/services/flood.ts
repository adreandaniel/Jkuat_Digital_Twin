import { apiClient } from "./api";
import type { FloodResult, SimulationResponse } from "../types";

export const getCurrentFlood = async () =>
  (await apiClient.get<FloodResult>("/flood/current")).data;

export const runFloodSimulation = async (
  rainfall_mm: number,
  duration_hr: number,
  antecedent_3h_mm: number,
  land_cover_factor: number
) =>
  (await apiClient.post<SimulationResponse>("/simulation/run", {
    rainfall_mm,
    duration_hr,
    antecedent_3h_mm,
    land_cover_factor
  })).data;
