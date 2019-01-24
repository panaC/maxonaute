import { worker } from "./worker";

if (require.main === module) {
  worker();
}
