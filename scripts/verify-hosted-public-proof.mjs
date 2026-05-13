import fs from "node:fs";
import path from "node:path";

const appUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.GIAOAN_DEMO_URL ||
  "https://chot-de-dong-439a.vercel.app";

const strict = String(process.env.STRICT_HOSTED_PROOF || "true") === "true";

const artifactsDir = path.join(process.cwd(), "artifacts");
fs.mkdirSync(artifactsDir, { recursive: true });

const startedAt = new Date().toISOString();

function writeReport(report) {
  fs.writeFileSync(
    path.join(artifactsDir, "p0-hosted-public-proof.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );
}

function fail(reason, extra = {}) {
  const report = {
    ok: false,
    phase: "p0-hosted-public-proof",
    appUrl,
    strict,
    startedAt,
    finishedAt: new Date().toISOString(),
    reason,
    ...extra,
  };

  writeReport(report);
  console.error("[p0-hosted-public-proof] FAIL:", reason);
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

function pass(extra = {}) {
  const report = {
    ok: true,
    phase: "p0-hosted-public-proof",
    appUrl,
    strict,
    startedAt,
    finishedAt: new Date().toISOString(),
    ...extra,
  };

  writeReport(report);
  console.log("[p0-hosted-public-proof] PASS");
  console.log(JSON.stringify(report, null, 2));
}

if (!appUrl.startsWith("https://")) {
  fail("APP_URL must be a real HTTPS URL");
}

let response;
let body = "";

try {
  response = await fetch(appUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "giaoan-p0-hosted-proof/1.0",
    },
  });

  body = await response.text();
} catch (error) {
  fail("Cannot fetch hosted app URL", {
    error: error instanceof Error ? error.message : String(error),
  });
}

const statusOk = response.status >= 200 && response.status < 400;
const contentType = response.headers.get("content-type") || "";
const bodyLength = body.length;
const lowerBody = body.toLowerCase();

const fatalMarkers = [
  "deployment_not_found",
  "404: this page could not be found",
  "application error",
  "internal server error",
  "this deployment has been disabled",
];

const appMarkers = [
  "giáo án",
  "giaoan",
  "workspace",
  "tạo giáo án",
  "legal gate",
  "release gate",
];

const foundFatalMarkers = fatalMarkers.filter((marker) =>
  lowerBody.includes(marker)
);

const foundAppMarkers = appMarkers.filter((marker) =>
  lowerBody.includes(marker)
);

const checks = [
  {
    name: "https_url",
    passed: appUrl.startsWith("https://"),
  },
  {
    name: "http_status_2xx_or_3xx",
    passed: statusOk,
    detail: response.status,
  },
  {
    name: "non_empty_body",
    passed: bodyLength > 500,
    detail: bodyLength,
  },
  {
    name: "no_fatal_hosted_error_marker",
    passed: foundFatalMarkers.length === 0,
    detail: foundFatalMarkers,
  },
  {
    name: "app_identity_marker_found",
    passed: foundAppMarkers.length >= 1,
    detail: foundAppMarkers,
  },
];

fs.writeFileSync(
  path.join(artifactsDir, "p0-hosted-homepage-snippet.txt"),
  body.slice(0, 3000).replace(/\s+/g, " ").trim(),
  "utf8"
);

const failedChecks = checks.filter((check) => !check.passed);

if (failedChecks.length > 0 && strict) {
  fail("Hosted public proof checks failed", {
    status: response.status,
    contentType,
    bodyLength,
    checks,
    failedChecks,
  });
}

pass({
  status: response.status,
  contentType,
  bodyLength,
  checks,
  warnings: failedChecks.map((check) => check.name),
});
