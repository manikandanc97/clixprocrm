export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const dns = await import('dns');
      dns.setDefaultResultOrder('ipv4first');
    } catch {
      // dns order setting fallback
    }
  }
}
