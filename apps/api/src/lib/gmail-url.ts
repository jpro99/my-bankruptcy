export function buildGmailComposeUrl(input: {
  to?: string;
  subject: string;
  body: string;
}): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    su: input.subject,
    body: input.body,
  });
  if (input.to) params.set("to", input.to);
  return `https://mail.google.com/mail/?${params.toString()}`;
}
