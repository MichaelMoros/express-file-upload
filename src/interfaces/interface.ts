import { Request } from "express";
import { Order } from "../enums/enums";

interface Photo {
  _id: string;
  name: string;
  src: string;
  description: string;
  createdAt: string;
  tags: string[];
}

export { Photo }