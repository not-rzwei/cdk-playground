import { App } from "cdktf";
import { InfraStack } from "./InfraStack";

const app = new App();

new InfraStack(app, "dev", {
  name: "dev",
  environment: "development",
  region: "us-west-2",
});

new InfraStack(app, "stage", {
  name: "stage",
  environment: "staging",
  region: "us-west-1",
});

new InfraStack(app, "prod", {
  name: "prod",
  environment: "production",
  region: "us-east-1",
});

app.synth();
