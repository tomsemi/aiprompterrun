export function GET() {
  return new Response(["User-agent: *", "Allow: /", "Sitemap: https://aiprompter.run/sitemap.xml"].join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
