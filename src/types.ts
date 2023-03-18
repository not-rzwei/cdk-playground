export type ProjectConfig = {
  name: string;
  environment: "development" | "staging" | "production";
  region: string;
};

export namespace ProjectConfig {
  export function toClusterName(config: ProjectConfig) {
    return `${config.name}-${config.environment}-${config.region}`;
  }
}
