import { AxiosRequestConfig } from "axios";

export interface ServiceAxiosRequestConfig extends AxiosRequestConfig {
  service?: "ssl" | "backend" | "voice" | "file" | "clinvoice" | "abha";
}
