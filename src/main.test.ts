import { Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { InfraStack } from "./InfraStack";

describe("CDK for Terraform", () => {
  it("should be valid terraform", () => {
    const app = Testing.app();

    const dev = new InfraStack(app, "dev", {
      name: "dev",
      environment: "development",
      region: "us-west-2",
    });

    const prod = new InfraStack(app, "prod", {
      name: "prod",
      environment: "production",
      region: "us-east-1",
    });

    expect(Testing.fullSynth(dev)).toBeValidTerraform();
    expect(Testing.fullSynth(prod)).toBeValidTerraform();
  });
});
