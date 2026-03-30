export interface MembersApiPathMatch {
  path: string;
  method: "get";
}

interface OpenApiParameter {
  name?: string;
  in?: string;
}

interface OpenApiOperation {
  summary?: string;
  parameters?: OpenApiParameter[];
}

interface OpenApiSpec {
  paths?: Record<string, { get?: OpenApiOperation }>;
}

export function discoverCurrentMembersSearchPath(spec: OpenApiSpec): MembersApiPathMatch {
  for (const [path, definition] of Object.entries(spec.paths ?? {})) {
    const operation = definition.get;
    if (!operation) {
      continue;
    }

    const parameterNames = new Set(
      (operation.parameters ?? [])
        .filter((parameter) => parameter.in === "query" && parameter.name)
        .map((parameter) => parameter.name),
    );

    const summary = operation.summary?.toLowerCase() ?? "";

    if (
      summary.includes("current members of the commons or lords") &&
      parameterNames.has("House") &&
      parameterNames.has("IsCurrentMember") &&
      parameterNames.has("skip") &&
      parameterNames.has("take")
    ) {
      return {
        path,
        method: "get",
      };
    }
  }

  throw new Error(
    "Could not discover a documented Members API endpoint for current Commons members from the OpenAPI spec.",
  );
}
