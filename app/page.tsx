import { isAuthenticated } from "@/lib/auth";
import { Login } from "./studio/login";
import { Studio } from "./studio/studio";

export default async function Home() {
  if (!(await isAuthenticated())) {
    return <Login />;
  }

  return <Studio />;
}
