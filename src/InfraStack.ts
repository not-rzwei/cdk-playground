import { Fn, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { TerraformAwsEksBlueprints } from "../.gen/modules/aws-ia/terraform-aws-eks-blueprints";
import { KubernetesAddons } from "../.gen/modules/aws-ia/terraform-aws-eks-blueprints/modules/kubernetes-addons";
import { Rds } from "../.gen/modules/cloudposse/aws/rds";
import { Vpc } from "../.gen/modules/terraform-aws-modules/aws/vpc";
import { dataAwsAvailabilityZones, provider } from "../.gen/providers/aws";
import { ProjectConfig } from "./types";

export class InfraStack extends TerraformStack {
  constructor(scope: Construct, id: string, projectConfig: ProjectConfig) {
    super(scope, id);

    new provider.AwsProvider(this, "aws", {
      region: projectConfig.region,
    });

    const allAvailabilityZones =
      new dataAwsAvailabilityZones.DataAwsAvailabilityZones(
        this,
        "all-availability-zones"
      ).names;

    const clusterName = ProjectConfig.toClusterName(projectConfig);

    // Networking
    const vpc = new Vpc(this, "vpc", {
      name: `${clusterName}-vpc`,
      cidr: "10.0.0.0/16",
      azs: allAvailabilityZones,
      privateSubnets: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"],
      publicSubnets: ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"],
      enableNatGateway: true,
      singleNatGateway: true,
      enableDnsHostnames: true,
      tags: {
        [`kubernetes.io/cluster/${clusterName}`]: "shared",
      },
      publicSubnetTags: {
        [`kubernetes.io/cluster/${clusterName}`]: "shared",
        "kubernetes.io/role/elb": "1",
      },
      privateSubnetTags: {
        [`kubernetes.io/cluster/${clusterName}`]: "shared",
        "kubernetes.io/role/internal-elb": "1",
      },
    });

    // Kubernetes
    const eksBlueprint = new TerraformAwsEksBlueprints(this, "eks-blueprint", {
      clusterName: ProjectConfig.toClusterName(projectConfig),
      vpcId: vpc.vpcIdOutput,
      privateSubnetIds: Fn.tolist(vpc.privateSubnetsOutput),
      publicSubnetIds: Fn.tolist(vpc.publicSubnetsOutput),
      clusterVersion: "1.21",
      managedNodeGroups: [
        {
          node_group_name: "managed-ondemand",
          instance_types: ["m5.large"],
          min_size: 3,
        },
      ],
    });

    // Kubernetes Add Ons
    new KubernetesAddons(this, "eks-addons", {
      eksClusterId: eksBlueprint.eksClusterIdOutput,
      // Essential
      enableAmazonEksVpcCni: true,
      enableAmazonEksCoredns: true,
      enableAmazonEksKubeProxy: true,
      enableAmazonEksAwsEbsCsiDriver: true,
      enableAwsLoadBalancerController: true,
      // GitOps bridge
      enableMetricsServer: true,
      enableClusterAutoscaler: true,
      enablePrometheus: true,
      // ArgoCD Config
      enableArgocd: true,
      argocdManageAddOns: true,
    });

    // Database
    new Rds(this, "db", {
      databasePort: 3306,
      dbParameterGroup: "mysql5.7",
      engineVersion: "5.7.17",
      instanceClass: "db.t2.medium",
      vpcId: vpc.vpcIdOutput,
      subnetIds: Fn.tolist(vpc.privateSubnetsOutput),
      multiAz: true,
    });
  }
}
