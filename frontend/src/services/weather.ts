import { apiClient } from "./api";
import type { WeatherData } from "../types";

export const getCurrentWeather = async () =>
  (await apiClient.get<WeatherData>("/weather/current")).data;

export const getRainfallMetrics = async () =>
  (await apiClient.get("/weather/metrics")).data;

export const getRainfallHistory = async (limit = 48) =>
  (await apiClient.get<{ records: Record<string, string | number>[] }>(`/weather/history?limit=${limit}`)).data;
