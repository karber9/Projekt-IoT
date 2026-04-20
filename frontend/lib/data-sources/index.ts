import { IS_MOCK_MODE } from "@/lib/config";
import { mockDataSource } from "./mock";
import { realDataSource } from "./real";

export const dataSource = IS_MOCK_MODE ? mockDataSource : realDataSource;