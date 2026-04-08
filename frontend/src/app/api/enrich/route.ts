import { NextRequest, NextResponse } from "next/server";

const SOCIAL_DOMAIN_MAP: Record<string, string> = {
  "instagram.com": "instagram",
  "facebook.com": "facebook",
  "x.com": "x",
  "twitter.com": "x",
  "linkedin.com": "linkedin",
  "youtube.com": "youtube",
  "tiktok.com": "tiktok",
};

function normalizeWebsiteUrl(rawWebsite: string): string | null {
  const trimmed = rawWebsite.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractEmails(html: string): string[] {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const matches = html.match(emailRegex) ?? [];

  const cleaned = matches
    .map((email) => email.toLowerCase())
    .filter((email) => !email.endsWith(".png") && !email.endsWith(".jpg"));

  return [...new Set(cleaned)];
}

function extractAnchorHrefs(html: string): string[] {
  const hrefRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  const hrefs: string[] = [];
  let match: RegExpExecArray | null;

  while (true) {
    match = hrefRegex.exec(html);
    if (!match) {
      break;
    }

    if (match[1]) {
      hrefs.push(match[1]);
    }
  }

  return hrefs;
}

function inferSocialProfiles(html: string, baseUrl: string): Record<string, string> {
  const hrefs = extractAnchorHrefs(html);
  const profiles: Record<string, string> = {};

  for (const href of hrefs) {
    try {
      const absoluteUrl = new URL(href, baseUrl);
      const hostname = absoluteUrl.hostname.toLowerCase().replace(/^www\./, "");

      for (const domain of Object.keys(SOCIAL_DOMAIN_MAP)) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          const key = SOCIAL_DOMAIN_MAP[domain];
          if (!profiles[key]) {
            profiles[key] = absoluteUrl.toString();
          }
        }
      }
    } catch {
      continue;
    }
  }

  return profiles;
}

export async function GET(request: NextRequest) {
  const websiteParam = request.nextUrl.searchParams.get("website") ?? "";
  const website = normalizeWebsiteUrl(websiteParam);

  if (!website) {
    return NextResponse.json({ email: null, socialProfiles: {} }, { status: 200 });
  }

  try {
    const response = await fetch(website, {
      headers: {
        "User-Agent": "LocalMinerBot/1.0 (+https://localminer.local)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      return NextResponse.json({ email: null, socialProfiles: {} }, { status: 200 });
    }

    const html = await response.text();
    const emails = extractEmails(html);
    const socialProfiles = inferSocialProfiles(html, website);

    return NextResponse.json({
      email: emails[0] ?? null,
      socialProfiles,
    });
  } catch {
    return NextResponse.json({ email: null, socialProfiles: {} }, { status: 200 });
  }
}
